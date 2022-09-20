import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherAdminServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-admin.service.abstraction";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { CipherBulkDeleteRequest } from "@bitwarden/common/models/request/cipherBulkDeleteRequest";
import { CipherCollectionsRequest } from "@bitwarden/common/models/request/cipherCollectionsRequest";
import { CipherCreateRequest } from "@bitwarden/common/models/request/cipherCreateRequest";
import { CipherRequest } from "@bitwarden/common/models/request/cipherRequest";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { Utils } from "./utils";

export class CipherAdminService implements CipherAdminServiceAbstraction {
  constructor(private apiService: ApiService, private i18nService: I18nService) {}

  async getOrganizationCipherViews(organizationId: string): Promise<CipherView[]> {
    const ciphers = await this.getOrganizationCiphers(organizationId);
    if (ciphers != null && ciphers.data != null && ciphers.data.length) {
      const decCiphers: CipherView[] = [];
      const promises: any[] = [];
      ciphers.data.forEach((r) => {
        const data = new CipherData(r);
        const cipher = new Cipher(data);
        promises.push(cipher.decrypt().then((c) => decCiphers.push(c)));
      });
      await Promise.all(promises);
      decCiphers.sort(Utils.getLocaleSortingFunction(this.i18nService));
      return decCiphers;
    } else {
      return [];
    }
  }
  async getOrganizationCiphers(organizationId: string): Promise<ListResponse<CipherResponse>> {
    const r = await this.apiService.send(
      "GET",
      "/ciphers/organization-details?organizationId=" + organizationId,
      null,
      true,
      true
    );
    return new ListResponse(r, CipherResponse);
  }

  putCipherCollectionsAdmin(id: string, request: CipherCollectionsRequest): Promise<any> {
    return this.apiService.send(
      "PUT",
      "/ciphers/" + id + "/collections-admin",
      request,
      true,
      false
    );
  }

  async getCipherAdmin(id: string): Promise<CipherResponse> {
    const r = await this.apiService.send("GET", "/ciphers/" + id + "/admin", null, true, true);
    return new CipherResponse(r);
  }

  async postCipherAdmin(request: CipherCreateRequest): Promise<CipherResponse> {
    const r = await this.apiService.send("POST", "/ciphers/admin", request, true, true);
    return new CipherResponse(r);
  }

  async putCipherAdmin(id: string, request: CipherRequest): Promise<CipherResponse> {
    const r = await this.apiService.send("PUT", "/ciphers/" + id + "/admin", request, true, true);
    return new CipherResponse(r);
  }

  deleteCipherAdmin(id: string): Promise<any> {
    return this.apiService.send("DELETE", "/ciphers/" + id + "/admin", null, true, false);
  }

  deleteManyCiphersAdmin(request: CipherBulkDeleteRequest): Promise<any> {
    return this.apiService.send("DELETE", "/ciphers/admin", request, true, false);
  }
  putDeleteCipherAdmin(id: string): Promise<any> {
    return this.apiService.send("PUT", "/ciphers/" + id + "/delete-admin", null, true, false);
  }
  putDeleteManyCiphersAdmin(request: CipherBulkDeleteRequest): Promise<any> {
    return this.apiService.send("PUT", "/ciphers/delete-admin", request, true, false);
  }

  async putRestoreCipherAdmin(id: string): Promise<CipherResponse> {
    const r = await this.apiService.send(
      "PUT",
      "/ciphers/" + id + "/restore-admin",
      null,
      true,
      true
    );
    return new CipherResponse(r);
  }
}
