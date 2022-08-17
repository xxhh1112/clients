import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherApiAttachmentServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-api-attachment.service.abstraction";
import { InternalCipherService } from "@bitwarden/common/abstractions/cipher/cipher.service.abstraction";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { FileUploadService } from "@bitwarden/common/abstractions/fileUpload.service";
import { Utils } from "@bitwarden/common/misc/utils";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { AttachmentFileUpload } from "@bitwarden/common/models/domain/attachmentFileUpload";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { EncArrayBuffer } from "@bitwarden/common/models/domain/encArrayBuffer";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { AttachmentRequest } from "@bitwarden/common/models/request/attachmentRequest";
import { CipherShareRequest } from "@bitwarden/common/models/request/cipherShareRequest";
import { AttachmentResponse } from "@bitwarden/common/models/response/attachmentResponse";
import { AttachmentUploadDataResponse } from "@bitwarden/common/models/response/attachmentUploadDataResponse";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { ErrorResponse } from "@bitwarden/common/models/response/errorResponse";
import { AttachmentView } from "@bitwarden/common/models/view/attachmentView";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

export class CipherApiAttachmentService implements CipherApiAttachmentServiceAbstraction {
  constructor(
    private cipherService: InternalCipherService,
    private apiService: ApiService,
    private cryptoService: CryptoService,
    private fileUploadService: FileUploadService
  ) {}

  async deleteAttachmentWithServer(id: string, attachmentId: string): Promise<void> {
    try {
      await this.deleteCipherAttachment(id, attachmentId);
    } catch (e) {
      return Promise.reject((e as ErrorResponse).getSingleMessage());
    }
    await this.cipherService.deleteAttachment(id, attachmentId);
  }

  async putShareCipher(id: string, request: CipherShareRequest): Promise<CipherResponse> {
    const r = await this.apiService.send("PUT", "/ciphers/" + id + "/share", request, true, true);
    return new CipherResponse(r);
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

  async getAttachmentData(
    cipherId: string,
    attachmentId: string,
    emergencyAccessId?: string
  ): Promise<AttachmentResponse> {
    const path =
      (emergencyAccessId != null ? "/emergency-access/" + emergencyAccessId + "/" : "/ciphers/") +
      cipherId +
      "/attachment/" +
      attachmentId;
    const r = await this.apiService.send("GET", path, null, true, true);
    return new AttachmentResponse(r);
  }

  nativeFetch(request: Request): Promise<Response> {
    return fetch(request);
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
      const attachmentFileUpload: AttachmentFileUpload = {
        admin: admin,
        cipherId: cipher.id,
        encFileName: encFileName,
        encData: encData,
        key: dataEncKey[1],
      };

      response = await this.throwErrorOnSaveAttachmentRawWithServer(
        e,
        response,
        attachmentFileUpload
      );
    }

    const cData = new CipherData(response, cipher.collectionIds);
    if (!admin) {
      await this.cipherService.upsert(cData);
    }
    return new Cipher(cData);
  }

  private async throwErrorOnSaveAttachmentRawWithServer(
    e: any,
    response: CipherResponse,
    attachmentFileUpload: AttachmentFileUpload
  ) {
    if (
      (e instanceof ErrorResponse && (e as ErrorResponse).statusCode === 404) ||
      (e as ErrorResponse).statusCode === 405
    ) {
      response = await this.legacyServerAttachmentFileUpload(attachmentFileUpload);
    } else if (e instanceof ErrorResponse) {
      throw new Error((e as ErrorResponse).getSingleMessage());
    } else {
      throw e;
    }
    return response;
  }

  /**
   * @deprecated Mar 25 2021: This method has been deprecated in favor of direct uploads.
   * This method still exists for backward compatibility with old server versions.
   */
  async legacyServerAttachmentFileUpload(request: AttachmentFileUpload) {
    const fd = new FormData();
    try {
      const blob = new Blob([request.encData.buffer], { type: "application/octet-stream" });
      fd.append("key", request.key.encryptedString);
      fd.append("data", blob, request.encFileName.encryptedString);
    } catch (e) {
      if (Utils.isNode && !Utils.isBrowser) {
        fd.append("key", request.key.encryptedString);
        fd.append(
          "data",
          Buffer.from(request.encData.buffer) as any,
          {
            filepath: request.encFileName.encryptedString,
            contentType: "application/octet-stream",
          } as any
        );
      } else {
        throw e;
      }
    }

    let response: CipherResponse;
    try {
      if (request.admin) {
        response = await this.postCipherAttachmentAdminLegacy(request.cipherId, fd);
      } else {
        response = await this.postCipherAttachmentLegacy(request.cipherId, fd);
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

    const fd = new FormData();

    this.creatBlobObject(decBuf, encFileName, key);

    try {
      await this.postShareCipherAttachment(cipherId, attachmentView.id, fd, organizationId);
    } catch (e) {
      throw new Error((e as ErrorResponse).getSingleMessage());
    }
  }

  private async creatBlobObject(
    decBuf: ArrayBuffer,
    encFileName: EncString,
    key: SymmetricCryptoKey
  ) {
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
  }
}
