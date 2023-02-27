import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";
import { EncryptService } from "@bitwarden/common/abstractions/encrypt.service";
import { Utils } from "@bitwarden/common/misc/utils";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";
import { ListResponse } from "@bitwarden/common/models/response/list.response";

import { AccessTokenRequest } from "../models/requests/access-token.request";
import { RevokeAccessTokensRequest } from "../models/requests/revoke-access-tokens.request";
import { AccessTokenCreationResponse } from "../models/responses/access-token-creation.response";
import { AccessTokenResponse } from "../models/responses/access-tokens.response";
import { AccessTokenView } from "../models/view/access-token.view";

@Injectable({
  providedIn: "root",
})
export class AccessService {
  private readonly _accessTokenVersion = "0";
  protected _accessToken: Subject<AccessTokenView> = new Subject();

  accessToken$ = this._accessToken.asObservable();

  constructor(
    private cryptoService: CryptoService,
    private apiService: ApiService,
    private cryptoFunctionService: CryptoFunctionService,
    private encryptService: EncryptService
  ) {}

  async getAccessTokens(
    organizationId: string,
    serviceAccountId: string
  ): Promise<AccessTokenView[]> {
    const r = await this.apiService.send(
      "GET",
      "/service-accounts/" + serviceAccountId + "/access-tokens",
      null,
      true,
      true
    );
    const results = new ListResponse(r, AccessTokenResponse);

    return await this.decryptMany(organizationId, results.data);
  }

  async createAccessToken(
    organizationId: string,
    serviceAccountId: string,
    accessTokenView: AccessTokenView
  ): Promise<string> {
    const keyMaterial = await this.cryptoFunctionService.randomBytes(16);
    const key = await this.cryptoFunctionService.hkdf(
      keyMaterial,
      "bitwarden-accesstoken",
      "sm-access-token",
      64,
      "sha256"
    );
    const encryptionKey = new SymmetricCryptoKey(key);

    const request = await this.makeAccessTokenRequest(
      organizationId,
      encryptionKey,
      accessTokenView
    );
    const r = await this.apiService.send(
      "POST",
      "/service-accounts/" + serviceAccountId + "/access-tokens",
      request,
      true,
      true
    );
    const result = new AccessTokenCreationResponse(r);
    this._accessToken.next(null);
    const b64Key = Utils.fromBufferToB64(keyMaterial);
    return `${this._accessTokenVersion}.${result.id}.${result.clientSecret}:${b64Key}`;
  }

  async revokeAccessTokens(serviceAccountId: string, accessTokenIds: string[]): Promise<void> {
    const request = new RevokeAccessTokensRequest();
    request.ids = accessTokenIds;

    await this.apiService.send(
      "POST",
      "/service-accounts/" + serviceAccountId + "/access-tokens/revoke",
      request,
      true,
      false
    );

    this._accessToken.next(null);
  }

  private async makeAccessTokenRequest(
    organizationId: string,
    encryptionKey: SymmetricCryptoKey,
    accessTokenView: AccessTokenView
  ): Promise<AccessTokenRequest> {
    const key = await this.getOrganizationKey(organizationId);

    const accessToken = await this.encryptService.encryptView(accessTokenView, key);

    const request = new AccessTokenRequest();
    request.name = accessToken.name;

    [request.encryptedPayload, request.key] = await Promise.all([
      await this.encryptService.encrypt(
        JSON.stringify({ encryptionKey: key.keyB64 }),
        encryptionKey
      ),
      await this.encryptService.encrypt(encryptionKey.keyB64, key),
    ]);

    request.expireAt = accessTokenView.expireAt;
    return request;
  }

  private async getOrganizationKey(organizationId: string): Promise<SymmetricCryptoKey> {
    return await this.cryptoService.getOrgKey(organizationId);
  }

  private async decryptMany(
    organizationId: string,
    accessTokenResponses: AccessTokenResponse[]
  ): Promise<AccessTokenView[]> {
    const key = await this.getOrganizationKey(organizationId);
    return await Promise.all(
      accessTokenResponses.map(async (at) => {
        return await this.encryptService.decryptDomain(AccessTokenView, at.toAccessToken(), key);
      })
    );
  }
}
