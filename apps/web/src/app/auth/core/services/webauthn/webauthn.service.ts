import { Injectable, Optional } from "@angular/core";
import { BehaviorSubject, filter, from, map, Observable, shareReplay, switchMap, tap } from "rxjs";

import { LogService } from "@bitwarden/common/abstractions/log.service";
import { Verification } from "@bitwarden/common/types/verification";

import { CoreAuthModule } from "../../core.module";
import { CredentialCreateOptionsView } from "../../views/credential-create-options.view";
import { PendingWebauthnCredentialView } from "../../views/pending-webauthn-credential.view";
import { WebauthnCredentialView } from "../../views/webauthn-credential.view";

import { SaveCredentialRequest } from "./request/save-credential.request";
import { WebauthnAttestationResponseRequest } from "./request/webauthn-attestation-response.request";
import { WebauthnApiService } from "./webauthn-api.service";

@Injectable({ providedIn: CoreAuthModule })
export class WebauthnService {
  private navigatorCredentials: CredentialsContainer;
  private _refresh$ = new BehaviorSubject<void>(undefined);
  private _loading$ = new BehaviorSubject<boolean>(true);

  readonly credentials$ = this._refresh$.pipe(
    tap(() => this._loading$.next(true)),
    switchMap(() => this.getCredentials$()),
    tap(() => this._loading$.next(false)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly loading$ = this._loading$.asObservable();

  constructor(
    private apiService: WebauthnApiService,
    @Optional() navigatorCredentials?: CredentialsContainer,
    @Optional() private logService?: LogService
  ) {
    // Default parameters don't work when used with Angular DI
    this.navigatorCredentials = navigatorCredentials ?? navigator.credentials;
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
      return new PendingWebauthnCredentialView(credentialOptions.token, response, supportsPrf);
    } catch (error) {
      this.logService?.error(error);
      return undefined;
    }
  }

  async saveCredential(credential: PendingWebauthnCredentialView, name: string) {
    const request = new SaveCredentialRequest();
    request.deviceResponse = new WebauthnAttestationResponseRequest(credential.deviceResponse);
    request.token = credential.token;
    request.name = name;
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
    return from(this.apiService.getCredentials()).pipe(map((response) => response.data));
  }

  private refresh() {
    this._refresh$.next();
  }
}
