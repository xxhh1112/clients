import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

import { AbstractEncryptService } from "@bitwarden/common/abstractions/abstractEncrypt.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";
import { ServiceAccountView } from "@bitwarden/common/models/view/service-account-view";

import { ServiceAccountResponse } from "./responses/service-account.response";

@Injectable({
  providedIn: "root",
})
export class ServiceAccountService {
  protected _serviceAccount: Subject<ServiceAccountView> = new Subject();

  serviceAccount$ = this._serviceAccount.asObservable();

  constructor(
    private cryptoService: CryptoService,
    private apiService: ApiService,
    private encryptService: AbstractEncryptService
  ) {}

  async getServiceAccounts(organizationId: string): Promise<ServiceAccountView[]> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + organizationId + "/service-accounts",
      null,
      true,
      true
    );
    const results = new ListResponse(r, ServiceAccountResponse);
    return await this.createServiceAccountViews(organizationId, results.data);
  }

  private async getOrganizationKey(organizationId: string): Promise<SymmetricCryptoKey> {
    return await this.cryptoService.getOrgKey(organizationId);
  }

  private async createServiceAccountView(
    organizationKey: SymmetricCryptoKey,
    serviceAccountResponse: ServiceAccountResponse
  ): Promise<ServiceAccountView> {
    const serviceAccountView = new ServiceAccountView();
    serviceAccountView.id = serviceAccountResponse.id;
    serviceAccountView.organizationId = serviceAccountResponse.organizationId;
    serviceAccountView.creationDate = serviceAccountResponse.creationDate;
    serviceAccountView.revisionDate = serviceAccountResponse.revisionDate;
    serviceAccountView.name = await this.encryptService.decryptToUtf8(
      new EncString(serviceAccountResponse.name),
      organizationKey
    );
    return serviceAccountView;
  }

  private async createServiceAccountViews(
    organizationId: string,
    serviceAccountResponses: ServiceAccountResponse[]
  ): Promise<ServiceAccountView[]> {
    const orgKey = await this.getOrganizationKey(organizationId);
    return await Promise.all(
      serviceAccountResponses.map(async (s: ServiceAccountResponse) => {
        return await this.createServiceAccountView(orgKey, s);
      })
    );
  }
}
