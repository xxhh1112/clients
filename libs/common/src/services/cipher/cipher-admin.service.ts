import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherAdminService as CipherAdminServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-admin.service.abstraction";
import { CipherBulkDeleteRequest } from "@bitwarden/common/models/request/cipherBulkDeleteRequest";
import { CipherCollectionsRequest } from "@bitwarden/common/models/request/cipherCollectionsRequest";
import { CipherCreateRequest } from "@bitwarden/common/models/request/cipherCreateRequest";
import { CipherRequest } from "@bitwarden/common/models/request/cipherRequest";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";

export class CipherAdminService implements CipherAdminServiceAbstraction {
  constructor(private apiService: ApiService) {}

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

  putCipherCollectionsAdmin(id: string, request: CipherCollectionsRequest): Promise<any> {
    return this.apiService.send(
      "PUT",
      "/ciphers/" + id + "/collections-admin",
      request,
      true,
      false
    );
  }
}
