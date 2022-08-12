import { CipherApiServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api.service.abstraction";
import { InternalCipherService } from "@bitwarden/common/abstractions/cipher/cipher.service.abstraction";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { FileUploadService } from "@bitwarden/common/abstractions/fileUpload.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { Utils } from "@bitwarden/common/misc/utils";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { EncArrayBuffer } from "@bitwarden/common/models/domain/encArrayBuffer";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { AttachmentRequest } from "@bitwarden/common/models/request/attachmentRequest";
import { CipherBulkDeleteRequest } from "@bitwarden/common/models/request/cipherBulkDeleteRequest";
import { CipherBulkMoveRequest } from "@bitwarden/common/models/request/cipherBulkMoveRequest";
import { CipherBulkRestoreRequest } from "@bitwarden/common/models/request/cipherBulkRestoreRequest";
import { CipherBulkShareRequest } from "@bitwarden/common/models/request/cipherBulkShareRequest";
import { CipherCollectionsRequest } from "@bitwarden/common/models/request/cipherCollectionsRequest";
import { CipherCreateRequest } from "@bitwarden/common/models/request/cipherCreateRequest";
import { CipherRequest } from "@bitwarden/common/models/request/cipherRequest";
import { CipherShareRequest } from "@bitwarden/common/models/request/cipherShareRequest";
import { ImportCiphersRequest } from "@bitwarden/common/models/request/importCiphersRequest";
import { ImportOrganizationCiphersRequest } from "@bitwarden/common/models/request/importOrganizationCiphersRequest";
import { SecretVerificationRequest } from "@bitwarden/common/models/request/secretVerificationRequest";
import { AttachmentUploadDataResponse } from "@bitwarden/common/models/response/attachmentUploadDataResponse";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { ErrorResponse } from "@bitwarden/common/models/response/errorResponse";
import { EventResponse } from "@bitwarden/common/models/response/eventResponse";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";
import { AttachmentView } from "@bitwarden/common/models/view/attachmentView";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { ApiService } from "../api.service";

export class CipherApiService implements CipherApiServiceAbstraction {
  constructor(
    private cipherService: InternalCipherService,
    private apiService: ApiService,
    private cryptoService: CryptoService,
    private fileUploadService: FileUploadService,
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

  async putShareCipher(id: string, request: CipherShareRequest): Promise<CipherResponse> {
    const r = await this.apiService.send("PUT", "/ciphers/" + id + "/share", request, true, true);
    return new CipherResponse(r);
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
  /**
   * @deprecated Mar 25 2021: This method has been deprecated in favor of direct uploads.
   * This method still exists for backward compatibility with old server versions.
   */
  async postCipherAttachmentLegacy(id: string, data: FormData): Promise<CipherResponse> {
    const r = await this.apiService.send(
      "POST",
      "/ciphers/" + id + "/attachment",
      data,
      true,
      true
    );
    return new CipherResponse(r);
  }

  /**
   * @deprecated Mar 25 2021: This method has been deprecated in favor of direct uploads.
   * This method still exists for backward compatibility with old server versions.
   */
  async postCipherAttachmentAdminLegacy(id: string, data: FormData): Promise<CipherResponse> {
    const r = await this.apiService.send(
      "POST",
      "/ciphers/" + id + "/attachment-admin",
      data,
      true,
      true
    );
    return new CipherResponse(r);
  }

  deleteCipherAttachment(id: string, attachmentId: string): Promise<any> {
    return this.apiService.send(
      "DELETE",
      "/ciphers/" + id + "/attachment/" + attachmentId,
      null,
      true,
      false
    );
  }

  deleteCipherAttachmentAdmin(id: string, attachmentId: string): Promise<any> {
    return this.apiService.send(
      "DELETE",
      "/ciphers/" + id + "/attachment/" + attachmentId + "/admin",
      null,
      true,
      false
    );
  }

  postShareCipherAttachment(
    id: string,
    attachmentId: string,
    data: FormData,
    organizationId: string
  ): Promise<any> {
    return this.apiService.send(
      "POST",
      "/ciphers/" + id + "/attachment/" + attachmentId + "/share?organizationId=" + organizationId,
      data,
      true,
      false
    );
  }

  async postCipherAttachment(
    id: string,
    request: AttachmentRequest
  ): Promise<AttachmentUploadDataResponse> {
    const r = await this.apiService.send(
      "POST",
      "/ciphers/" + id + "/attachment/v2",
      request,
      true,
      true
    );
    return new AttachmentUploadDataResponse(r);
  }

  nativeFetch(request: Request): Promise<Response> {
    return fetch(request);
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

  async shareWithServer(
    cipher: CipherView,
    organizationId: string,
    collectionIds: string[]
  ): Promise<any> {
    const attachmentPromises: Promise<any>[] = [];
    if (cipher.attachments != null) {
      cipher.attachments.forEach((attachment) => {
        if (attachment.key == null) {
          attachmentPromises.push(
            this.shareAttachmentWithServer(attachment, cipher.id, organizationId)
          );
        }
      });
    }
    await Promise.all(attachmentPromises);

    cipher.organizationId = organizationId;
    cipher.collectionIds = collectionIds;
    const encCipher = await this.cipherService.encrypt(cipher);
    const request = new CipherShareRequest(encCipher);
    const response = await this.putShareCipher(cipher.id, request);
    const data = new CipherData(response, collectionIds);
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

  async saveAttachmentRawWithServer(
    cipher: Cipher,
    filename: string,
    data: ArrayBuffer,
    admin = false
  ): Promise<Cipher> {
    const key = await this.cryptoService.getOrgKey(cipher.organizationId);
    const encFileName = await this.cryptoService.encrypt(filename, key);

    const dataEncKey = await this.cryptoService.makeEncKey(key);
    const encData = await this.cryptoService.encryptToBytes(data, dataEncKey[0]);

    const request: AttachmentRequest = {
      key: dataEncKey[1].encryptedString,
      fileName: encFileName.encryptedString,
      fileSize: encData.buffer.byteLength,
      adminRequest: admin,
    };

    let response: CipherResponse;
    try {
      const uploadDataResponse = await this.postCipherAttachment(cipher.id, request);
      response = admin ? uploadDataResponse.cipherMiniResponse : uploadDataResponse.cipherResponse;
      await this.fileUploadService.uploadCipherAttachment(
        admin,
        uploadDataResponse,
        encFileName,
        encData
      );
    } catch (e) {
      if (
        (e instanceof ErrorResponse && (e as ErrorResponse).statusCode === 404) ||
        (e as ErrorResponse).statusCode === 405
      ) {
        response = await this.legacyServerAttachmentFileUpload(
          admin,
          cipher.id,
          encFileName,
          encData,
          dataEncKey[1]
        );
      } else if (e instanceof ErrorResponse) {
        throw new Error((e as ErrorResponse).getSingleMessage());
      } else {
        throw e;
      }
    }

    const cData = new CipherData(response, cipher.collectionIds);
    if (!admin) {
      await this.cipherService.upsert(cData);
    }
    return new Cipher(cData);
  }

  /**
   * @deprecated Mar 25 2021: This method has been deprecated in favor of direct uploads.
   * This method still exists for backward compatibility with old server versions.
   */
  async legacyServerAttachmentFileUpload(
    admin: boolean,
    cipherId: string,
    encFileName: EncString,
    encData: EncArrayBuffer,
    key: EncString
  ) {
    const fd = new FormData();
    try {
      const blob = new Blob([encData.buffer], { type: "application/octet-stream" });
      fd.append("key", key.encryptedString);
      fd.append("data", blob, encFileName.encryptedString);
    } catch (e) {
      if (Utils.isNode && !Utils.isBrowser) {
        fd.append("key", key.encryptedString);
        fd.append(
          "data",
          Buffer.from(encData.buffer) as any,
          {
            filepath: encFileName.encryptedString,
            contentType: "application/octet-stream",
          } as any
        );
      } else {
        throw e;
      }
    }

    let response: CipherResponse;
    try {
      if (admin) {
        response = await this.postCipherAttachmentAdminLegacy(cipherId, fd);
      } else {
        response = await this.postCipherAttachmentLegacy(cipherId, fd);
      }
    } catch (e) {
      throw new Error((e as ErrorResponse).getSingleMessage());
    }

    return response;
  }

  saveAttachmentWithServer(cipher: Cipher, unencryptedFile: any, admin = false): Promise<Cipher> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(unencryptedFile);
      reader.onload = async (evt: any) => {
        try {
          const cData = await this.saveAttachmentRawWithServer(
            cipher,
            unencryptedFile.name,
            evt.target.result,
            admin
          );
          resolve(cData);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => {
        reject("Error reading file.");
      };
    });
  }

  async saveCollectionsWithServer(cipher: Cipher): Promise<any> {
    const request = new CipherCollectionsRequest(cipher.collectionIds);
    await this.putCipherCollections(cipher.id, request);
    const data = cipher.toCipherData();
    await this.cipherService.upsert(data);
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

  // Helpers

  private async shareAttachmentWithServer(
    attachmentView: AttachmentView,
    cipherId: string,
    organizationId: string
  ): Promise<any> {
    const attachmentResponse = await this.nativeFetch(
      new Request(attachmentView.url, { cache: "no-store" })
    );
    if (attachmentResponse.status !== 200) {
      throw Error("Failed to download attachment: " + attachmentResponse.status.toString());
    }

    const encBuf = await EncArrayBuffer.fromResponse(attachmentResponse);
    const decBuf = await this.cryptoService.decryptFromBytes(encBuf, null);
    const key = await this.cryptoService.getOrgKey(organizationId);
    const encFileName = await this.cryptoService.encrypt(attachmentView.fileName, key);

    const dataEncKey = await this.cryptoService.makeEncKey(key);
    const encData = await this.cryptoService.encryptToBytes(decBuf, dataEncKey[0]);

    const fd = new FormData();
    try {
      const blob = new Blob([encData.buffer], { type: "application/octet-stream" });
      fd.append("key", dataEncKey[1].encryptedString);
      fd.append("data", blob, encFileName.encryptedString);
    } catch (e) {
      if (Utils.isNode && !Utils.isBrowser) {
        fd.append("key", dataEncKey[1].encryptedString);
        fd.append(
          "data",
          Buffer.from(encData.buffer) as any,
          {
            filepath: encFileName.encryptedString,
            contentType: "application/octet-stream",
          } as any
        );
      } else {
        throw e;
      }
    }

    try {
      await this.postShareCipherAttachment(cipherId, attachmentView.id, fd, organizationId);
    } catch (e) {
      throw new Error((e as ErrorResponse).getSingleMessage());
    }
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
