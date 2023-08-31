import { BehaviorSubject, filter, from, map, Observable, shareReplay, switchMap, tap } from "rxjs";

import { FeatureFlag } from "../../../enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "../../../platform/abstractions/config/config.service.abstraction";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { LogService } from "../../../platform/abstractions/log.service";
import { Utils } from "../../../platform/misc/utils";
import { Verification } from "../../../types/verification";
import { WebauthnAdminServiceAbstraction } from "../../abstractions/webauthn/webauthn-admin.service.abstraction";
import { WebauthnApiServiceAbstraction } from "../../abstractions/webauthn/webauthn-api.service.abstraction";
import { CredentialCreateOptionsView } from "../../models/view/webauthn/credential-create-options.view";
import { PendingWebauthnCredentialView } from "../../models/view/webauthn/pending-webauthn-credential.view";
import { PendingWebauthnCryptoKeysView } from "../../models/view/webauthn/pending-webauthn-crypto-keys.view";
import { WebauthnCredentialView } from "../../models/view/webauthn/webauthn-credential.view";

import { SaveCredentialRequest } from "./request/save-credential.request";
import { WebauthnAttestationResponseRequest } from "./request/webauthn-attestation-response.request";
import { createSymmetricKeyFromPrf, getLoginWithPrfSalt } from "./utils";

export class WebauthnAdminService implements WebauthnAdminServiceAbstraction {
  private _refresh$ = new BehaviorSubject<void>(undefined);
  private _loading$ = new BehaviorSubject<boolean>(true);

  readonly enabled$: Observable<boolean>;
  readonly credentials$ = this._refresh$.pipe(
    tap(() => this._loading$.next(true)),
    switchMap(() => this.getCredentials$()),
    tap(() => this._loading$.next(false)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly loading$ = this._loading$.asObservable();

  constructor(
    private apiService: WebauthnApiServiceAbstraction,
    private cryptoService: CryptoService,
    private configService: ConfigServiceAbstraction,
    private navigatorCredentials: CredentialsContainer,
    private logService?: LogService
  ) {
    // Default parameters don't work when used with Angular DI
    this.navigatorCredentials = navigatorCredentials ?? navigator.credentials;
    this.enabled$ = from(this.configService.getFeatureFlagBool(FeatureFlag.PasswordlessLogin));
  }

  async getCredentialCreateOptions(
    verification: Verification
  ): Promise<CredentialCreateOptionsView | undefined> {
    const response = await this.apiService.getCredentialCreateOptions(verification);
    return new CredentialCreateOptionsView(response.options, response.token);
  }

  async createCredential(
    credentialOptions: CredentialCreateOptionsView
  ): Promise<PendingWebauthnCredentialView | undefined> {
    const nativeOptions: CredentialCreationOptions = {
      publicKey: credentialOptions.options,
    };
    // TODO: Remove `any` when typescript typings add support for PRF
    nativeOptions.publicKey.extensions = {
      prf: {},
    } as any;

    try {
      const response = await this.navigatorCredentials.create(nativeOptions);
      if (!(response instanceof PublicKeyCredential)) {
        return undefined;
      }
      // TODO: Remove `any` when typescript typings add support for PRF
      const supportsPrf = Boolean((response.getClientExtensionResults() as any).prf?.enabled);
      return new PendingWebauthnCredentialView(credentialOptions, response, supportsPrf);
    } catch (error) {
      this.logService?.error(error);
      return undefined;
    }
  }

  async createCryptoKeys(
    pendingCredential: PendingWebauthnCredentialView
  ): Promise<PendingWebauthnCryptoKeysView | undefined> {
    const nativeOptions: CredentialRequestOptions = {
      publicKey: {
        // TODO: Maybe don't reuse challenge
        challenge: pendingCredential.createOptions.options.challenge,
        allowCredentials: [{ id: pendingCredential.deviceResponse.rawId, type: "public-key" }],
        rpId: pendingCredential.createOptions.options.rp.id,
        timeout: pendingCredential.createOptions.options.timeout,
        userVerification:
          pendingCredential.createOptions.options.authenticatorSelection.userVerification,
        // TODO: Remove `any` when typescript typings add support for PRF
        extensions: { prf: { eval: { first: await getLoginWithPrfSalt() } } } as any,
      },
    };

    try {
      const response = await this.navigatorCredentials.get(nativeOptions);
      if (!(response instanceof PublicKeyCredential)) {
        return undefined;
      }
      // TODO: Remove `any` when typescript typings add support for PRF
      const prfResult = (response.getClientExtensionResults() as any).prf?.results?.first;
      const symmetricPrfKey = createSymmetricKeyFromPrf(prfResult);
      const [publicKey, privateKey] = await this.cryptoService.makeKeyPair(symmetricPrfKey);
      const rawUserKey = await this.cryptoService.getUserKey();
      const userKey = await this.cryptoService.rsaEncrypt(
        rawUserKey.key,
        Utils.fromB64ToArray(publicKey)
      );

      return new PendingWebauthnCryptoKeysView(userKey, publicKey, privateKey);
    } catch (error) {
      this.logService?.error(error);
      return undefined;
    }
  }

  async saveCredential(
    name: string,
    credential: PendingWebauthnCredentialView,
    cryptoKeys?: PendingWebauthnCryptoKeysView
  ) {
    const request = new SaveCredentialRequest();
    request.deviceResponse = new WebauthnAttestationResponseRequest(credential.deviceResponse);
    request.name = name;
    request.token = credential.createOptions.token;
    request.supportsPrf = credential.supportsPrf;
    request.prfPublicKey = cryptoKeys?.publicKey;
    request.prfPrivateKey = cryptoKeys?.privateKey.encryptedString;
    request.userKey = cryptoKeys?.userKey.encryptedString;
    await this.apiService.saveCredential(request);
    this.refresh();
  }

  getCredential$(credentialId: string): Observable<WebauthnCredentialView> {
    return this.credentials$.pipe(
      map(
        (credentials) => credentials.find((c) => c.id === credentialId),
        filter((c) => c !== undefined)
      )
    );
  }

  async deleteCredential(credentialId: string, verification: Verification): Promise<void> {
    await this.apiService.deleteCredential(credentialId, verification);
    this.refresh();
  }

  private getCredentials$(): Observable<WebauthnCredentialView[]> {
    return from(this.apiService.getCredentials()).pipe(
      map((response) =>
        response.data.map(
          (credential) =>
            new WebauthnCredentialView(credential.id, credential.name, credential.prfStatus)
        )
      )
    );
  }

  private refresh() {
    this._refresh$.next();
  }
}
