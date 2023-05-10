import { Injectable, Optional } from "@angular/core";
import { BehaviorSubject, from, map, Observable, shareReplay, switchMap, tap } from "rxjs";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { ErrorResponse } from "@bitwarden/common/models/response/error.response";
import { Verification } from "@bitwarden/common/types/verification";

import { CoreAuthModule } from "../../core.module";
import { CredentialCreateOptionsView } from "../../views/credential-create-options.view";
import { WebauthnCredentialView } from "../../views/webauth-credential.view";

import { SaveCredentialRequest } from "./request/save-credential.request";
import { WebauthnAttestationResponseRequest } from "./request/webauthn-attestation-response.request";
import { WebauthnApiService } from "./webauthn-api.service";

@Injectable({ providedIn: CoreAuthModule })
export class WebauthnService {
  private navigatorCredentials: CredentialsContainer;
  private _refresh$ = new BehaviorSubject<void>(undefined);
  private _loading$ = new BehaviorSubject<boolean>(true);

  readonly credentials$ = this._refresh$.pipe(
    switchMap(() => this.getCredentials$()),
    tap(() => this._loading$.next(false)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly loading$ = this._loading$.asObservable();

  constructor(
    private apiService: WebauthnApiService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    @Optional() navigatorCredentials?: CredentialsContainer,
    @Optional() private logService?: LogService
  ) {
    // Default parameters don't work when used with Angular DI
    this.navigatorCredentials = navigatorCredentials ?? navigator.credentials;
  }

  async getCredentialCreateOptions(
    verification: Verification
  ): Promise<CredentialCreateOptionsView | undefined> {
    try {
      const response = await this.apiService.getCredentialCreateOptions(verification);
      return new CredentialCreateOptionsView(response.options, response.token);
    } catch (error) {
      if (error instanceof ErrorResponse && error.statusCode === 400) {
        this.platformUtilsService.showToast(
          "error",
          this.i18nService.t("error"),
          this.i18nService.t("invalidMasterPassword")
        );
      } else {
        this.logService?.error(error);
        this.platformUtilsService.showToast("error", null, this.i18nService.t("unexpectedError"));
      }
      return undefined;
    }
  }

  async createCredential(
    credentialOptions: CredentialCreateOptionsView
  ): Promise<PublicKeyCredential | undefined> {
    const nativeOptions: CredentialCreationOptions = {
      publicKey: credentialOptions.options,
    };

    try {
      const response = await this.navigatorCredentials.create(nativeOptions);
      if (!(response instanceof PublicKeyCredential)) {
        return undefined;
      }
      return response;
    } catch (error) {
      this.logService?.error(error);
      return undefined;
    }
  }

  async saveCredential(
    credentialOptions: CredentialCreateOptionsView,
    deviceResponse: PublicKeyCredential,
    name: string
  ) {
    try {
      const request = new SaveCredentialRequest();
      request.deviceResponse = new WebauthnAttestationResponseRequest(deviceResponse);
      request.token = credentialOptions.token;
      request.name = name;
      await this.apiService.saveCredential(request);
      this.refresh();
      return true;
    } catch (error) {
      this.logService?.error(error);
      this.platformUtilsService.showToast("error", null, this.i18nService.t("unexpectedError"));
      return false;
    }
  }

  private getCredentials$(): Observable<WebauthnCredentialView[]> {
    return from(this.apiService.getCredentials()).pipe(map((response) => response.data));
  }

  private refresh() {
    this._loading$.next(true);
    this._refresh$.next();
  }
}
