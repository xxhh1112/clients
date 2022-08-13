import { CipherApiServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api.service.abstraction";
import { InternalCipherService } from "@bitwarden/common/abstractions/cipher/cipher.service.abstraction";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { CipherBulkDeleteRequest } from "@bitwarden/common/models/request/cipherBulkDeleteRequest";
import { CipherBulkMoveRequest } from "@bitwarden/common/models/request/cipherBulkMoveRequest";
import { CipherBulkRestoreRequest } from "@bitwarden/common/models/request/cipherBulkRestoreRequest";
import { CipherBulkShareRequest } from "@bitwarden/common/models/request/cipherBulkShareRequest";
import { CipherCollectionsRequest } from "@bitwarden/common/models/request/cipherCollectionsRequest";
import { CipherCreateRequest } from "@bitwarden/common/models/request/cipherCreateRequest";
import { CipherRequest } from "@bitwarden/common/models/request/cipherRequest";
import { ImportCiphersRequest } from "@bitwarden/common/models/request/importCiphersRequest";
import { ImportOrganizationCiphersRequest } from "@bitwarden/common/models/request/importOrganizationCiphersRequest";
import { SecretVerificationRequest } from "@bitwarden/common/models/request/secretVerificationRequest";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { EventResponse } from "@bitwarden/common/models/response/eventResponse";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { ApiService } from "../../abstractions/api.service";

export class CipherApiService implements CipherApiServiceAbstraction {
  constructor(
    private cipherService: InternalCipherService,
    private apiService: ApiService,
    private stateService: StateService
  ) {}

  async getCipher(id: string): Promise<CipherResponse> {
    const r = await this.apiService.send("GET", "/ciphers/" + id, null, true, true);
    return new CipherResponse(r);
  }
  async getFullCipherDetails(id: string): Promise<CipherResponse> {
    const r = await this.apiService.send("GET", "/ciphers/" + id + "/details", null, true, true);
    return new CipherResponse(r);
  }

  async getCiphersOrganization(organizationId: string): Promise<ListResponse<CipherResponse>> {
    const r = await this.apiService.send(
      "GET",
      "/ciphers/organization-details?organizationId=" + organizationId,
      null,
      true,
      true
    );
    return new ListResponse(r, CipherResponse);
  }
  async postCipher(request: CipherRequest): Promise<CipherResponse> {
    const r = await this.apiService.send("POST", "/ciphers", request, true, true);
    return new CipherResponse(r);
  }
  async postCipherCreate(request: CipherCreateRequest): Promise<CipherResponse> {
    const r = await this.apiService.send("POST", "/ciphers/create", request, true, true);
    return new CipherResponse(r);
  }

  async putCipher(id: string, request: CipherRequest): Promise<CipherResponse> {
    const r = await this.apiService.send("PUT", "/ciphers/" + id, request, true, true);
    return new CipherResponse(r);
  }

  deleteCipher(id: string): Promise<any> {
    return this.apiService.send("DELETE", "/ciphers/" + id, null, true, false);
  }

  deleteManyCiphers(request: CipherBulkDeleteRequest): Promise<any> {
    return this.apiService.send("DELETE", "/ciphers", request, true, false);
  }

  putMoveCiphers(request: CipherBulkMoveRequest): Promise<any> {
    return this.apiService.send("PUT", "/ciphers/move", request, true, false);
  }

  putShareCiphers(request: CipherBulkShareRequest): Promise<any> {
    return this.apiService.send("PUT", "/ciphers/share", request, true, false);
  }

  putCipherCollections(id: string, request: CipherCollectionsRequest): Promise<any> {
    return this.apiService.send("PUT", "/ciphers/" + id + "/collections", request, true, false);
  }

  postPurgeCiphers(
    request: SecretVerificationRequest,
    organizationId: string = null
  ): Promise<any> {
    let path = "/ciphers/purge";
    if (organizationId != null) {
      path += "?organizationId=" + organizationId;
    }
    return this.apiService.send("POST", path, request, true, false);
  }

  postImportCiphers(request: ImportCiphersRequest): Promise<any> {
    return this.apiService.send("POST", "/ciphers/import", request, true, false);
  }

  postImportOrganizationCiphers(
    organizationId: string,
    request: ImportOrganizationCiphersRequest
  ): Promise<any> {
    return this.apiService.send(
      "POST",
      "/ciphers/import-organization?organizationId=" + organizationId,
      request,
      true,
      false
    );
  }

  putDeleteCipher(id: string): Promise<any> {
    return this.apiService.send("PUT", "/ciphers/" + id + "/delete", null, true, false);
  }

  putDeleteManyCiphers(request: CipherBulkDeleteRequest): Promise<any> {
    return this.apiService.send("PUT", "/ciphers/delete", request, true, false);
  }

  async putRestoreCipher(id: string): Promise<CipherResponse> {
    const r = await this.apiService.send("PUT", "/ciphers/" + id + "/restore", null, true, true);
    return new CipherResponse(r);
  }

  async putRestoreManyCiphers(
    request: CipherBulkRestoreRequest
  ): Promise<ListResponse<CipherResponse>> {
    const r = await this.apiService.send("PUT", "/ciphers/restore", request, true, true);
    return new ListResponse<CipherResponse>(r, CipherResponse);
  }

  nativeFetch(request: Request): Promise<Response> {
    return fetch(request);
  }

  async getAllFromApiForOrganization(organizationId: string): Promise<CipherView[]> {
    const ciphers = await this.getCiphersOrganization(organizationId);
    if (ciphers != null && ciphers.data != null && ciphers.data.length) {
      const decCiphers: CipherView[] = [];
      const promises: any[] = [];
      ciphers.data.forEach((r) => {
        const data = new CipherData(r);
        const cipher = new Cipher(data);
        promises.push(cipher.decrypt().then((c) => decCiphers.push(c)));
      });
      await Promise.all(promises);
      decCiphers.sort(this.cipherService.getLocaleSortingFunction());
      return decCiphers;
    } else {
      return [];
    }
  }

  async getEventsCipher(
    id: string,
    start: string,
    end: string,
    token: string
  ): Promise<ListResponse<EventResponse>> {
    const r = await this.apiService.send(
      "GET",
      this.addEventParameters("/ciphers/" + id + "/events", start, end, token),
      null,
      true,
      true
    );
    return new ListResponse(r, EventResponse);
  }

  async saveWithServer(cipher: Cipher): Promise<any> {
    let response: CipherResponse;
    if (cipher.id == null) {
      if (cipher.collectionIds != null) {
        const request = new CipherCreateRequest(cipher);
        response = await this.postCipherCreate(request);
      } else {
        const request = new CipherRequest(cipher);
        response = await this.postCipher(request);
      }
      cipher.id = response.id;
    } else {
      const request = new CipherRequest(cipher);
      response = await this.putCipher(cipher.id, request);
    }

    const data = new CipherData(response, cipher.collectionIds);
    await this.cipherService.upsert(data);
  }

  async shareManyWithServer(
    ciphers: CipherView[],
    organizationId: string,
    collectionIds: string[]
  ): Promise<any> {
    const promises: Promise<any>[] = [];
    const encCiphers: Cipher[] = [];
    for (const cipher of ciphers) {
      cipher.organizationId = organizationId;
      cipher.collectionIds = collectionIds;
      promises.push(
        this.cipherService.encrypt(cipher).then((c) => {
          encCiphers.push(c);
        })
      );
    }
    await Promise.all(promises);
    const request = new CipherBulkShareRequest(encCiphers, collectionIds);
    try {
      await this.putShareCiphers(request);
    } catch (e) {
      for (const cipher of ciphers) {
        cipher.organizationId = null;
        cipher.collectionIds = null;
      }
      throw e;
    }
    await this.cipherService.upsert(encCiphers.map((c) => c.toCipherData()));
  }

  async moveManyWithServer(ids: string[], folderId: string): Promise<any> {
    await this.putMoveCiphers(new CipherBulkMoveRequest(ids, folderId));

    let ciphers = await this.stateService.getEncryptedCiphers();
    if (ciphers == null) {
      ciphers = {};
    }

    ids.forEach((id) => {
      // eslint-disable-next-line
      if (ciphers.hasOwnProperty(id)) {
        ciphers[id].folderId = folderId;
      }
    });

    await this.cipherService.clearCache();
    await this.stateService.setEncryptedCiphers(ciphers);
  }

  async deleteWithServer(id: string): Promise<any> {
    await this.deleteCipher(id);
    await this.cipherService.delete(id);
  }

  async deleteManyWithServer(ids: string[]): Promise<any> {
    await this.deleteManyCiphers(new CipherBulkDeleteRequest(ids));
    await this.cipherService.delete(ids);
  }

  async softDeleteWithServer(id: string): Promise<any> {
    await this.putDeleteCipher(id);
    await this.cipherService.softDelete(id);
  }

  async softDeleteManyWithServer(ids: string[]): Promise<any> {
    await this.putDeleteManyCiphers(new CipherBulkDeleteRequest(ids));
    await this.cipherService.softDelete(ids);
  }

  async restoreWithServer(id: string): Promise<any> {
    const response = await this.putRestoreCipher(id);
    await this.cipherService.restore({ id: id, revisionDate: response.revisionDate });
  }

  async restoreManyWithServer(ids: string[]): Promise<any> {
    const response = await this.putRestoreManyCiphers(new CipherBulkRestoreRequest(ids));
    const restores: { id: string; revisionDate: string }[] = [];
    for (const cipher of response.data) {
      restores.push({ id: cipher.id, revisionDate: cipher.revisionDate });
    }
    await this.cipherService.restore(restores);
  }

  async saveCollectionsWithServer(cipher: Cipher): Promise<any> {
    const request = new CipherCollectionsRequest(cipher.collectionIds);
    await this.putCipherCollections(cipher.id, request);
    const data = cipher.toCipherData();
    await this.cipherService.upsert(data);
  }

  private addEventParameters(base: string, start: string, end: string, token: string) {
    if (start != null) {
      base += "?start=" + start;
    }
    if (end != null) {
      base += base.indexOf("?") > -1 ? "&" : "?";
      base += "end=" + end;
    }
    if (token != null) {
      base += base.indexOf("?") > -1 ? "&" : "?";
      base += "continuationToken=" + token;
    }
    return base;
  }
}
