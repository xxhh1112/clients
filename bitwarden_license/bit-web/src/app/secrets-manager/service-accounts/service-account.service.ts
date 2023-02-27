import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { ListResponse } from "@bitwarden/common/models/response/list.response";

import { ServiceAccountView } from "../models/view/service-account.view";

import { ServiceAccountRequest } from "./models/requests/service-account.request";
import { ServiceAccountResponse } from "./models/responses/service-account.response";

@Injectable({
  providedIn: "root",
})
export class ServiceAccountService {
  protected _serviceAccount: Subject<ServiceAccountView> = new Subject();

  serviceAccount$ = this._serviceAccount.asObservable();

  constructor(private cryptoService: CryptoService, private apiService: ApiService) {}

  async getServiceAccounts(organizationId: string): Promise<ServiceAccountView[]> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + organizationId + "/service-accounts",
      null,
      true,
      true
    );
    const results = new ListResponse(r, ServiceAccountResponse);
    return await this.decryptMany(results.data);
  }

  async create(organizationId: string, view: ServiceAccountView) {
    const request = await this.makeServiceAccountRequest(view);
    const r = await this.apiService.send(
      "POST",
      "/organizations/" + organizationId + "/service-accounts",
      request,
      true,
      true
    );
    this._serviceAccount.next(await this.decrypt(new ServiceAccountResponse(r)));
  }

  private async makeServiceAccountRequest(view: ServiceAccountView) {
    const serviceAccount = await this.cryptoService.encryptView(view);

    const request = new ServiceAccountRequest();
    request.name = serviceAccount.name;
    return request;
  }

  private async decrypt(response: ServiceAccountResponse): Promise<ServiceAccountView> {
    return this.cryptoService.decryptDomain(ServiceAccountView, response.toServiceAccount());
  }

  private async decryptMany(responses: ServiceAccountResponse[]): Promise<ServiceAccountView[]> {
    return await Promise.all(
      responses.map(async (s) => {
        return await this.decrypt(s);
      })
    );
  }
}
