import { CipherAttachmentApiServiceAbstraction } from "../../abstractions/cipher/cipher-attachment-api.service.abstraction";
import { CipherData } from "../../models/data/cipher.data";
import { Cipher } from "../../models/domain/cipher";
import { EncArrayBuffer } from "../../models/domain/enc-array-buffer";
import { EncString } from "../../models/domain/enc-string";
import { SymmetricCryptoKey } from "../../models/domain/symmetric-crypto-key";
import { AttachmentRequest } from "../../models/request/attachment.request";
import { CipherBulkShareRequest } from "../../models/request/cipher-bulk-share.request";
import { CipherShareRequest } from "../../models/request/cipher-share.request";
import { AttachmentUploadDataResponse } from "../../models/response/attachment-upload-data.response";
import { AttachmentResponse } from "../../models/response/attachment.response";
import { CipherResponse } from "../../models/response/cipher.response";
import { ErrorResponse } from "../../models/response/error.response";
import { AttachmentView } from "../../models/view/attachment.view";
import { CipherView } from "../../models/view/cipher.view";

import { ApiService } from "./../../abstractions/api.service";
import { CipherService } from "./../../abstractions/cipher.service";
import { CryptoService } from "./../../abstractions/crypto.service";
import { FileUploadService } from "./../../abstractions/fileUpload.service";
import { Utils } from "./../../misc/utils";

export class CipherAttachmentApiService implements CipherAttachmentApiServiceAbstraction {
  constructor(
    private cipherService: CipherService,
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

  putShareCiphers(request: CipherBulkShareRequest): Promise<any> {
    return this.apiService.send("PUT", "/ciphers/share", request, true, false);
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
    const data = [new CipherData(response, collectionIds)];
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
    let uploadDataResponse: AttachmentUploadDataResponse;
    try {
      uploadDataResponse = await this.postCipherAttachment(cipher.id, request);
      response = admin ? uploadDataResponse.cipherMiniResponse : uploadDataResponse.cipherResponse;
      await this.fileUploadService.uploadCipherAttachment(
        admin,
        uploadDataResponse,
        encFileName,
        encData
      );
    } catch (e) {
      if (admin) {
        await this.deleteCipherAttachmentAdmin(response.id, uploadDataResponse.attachmentId);
      } else {
        await this.deleteCipherAttachment(response.id, uploadDataResponse.attachmentId);
      }
      await this.throwErrorOnSaveAttachmentRawWithServer(e);
    }

    const cData = new CipherData(response, cipher.collectionIds);
    if (!admin) {
      await this.cipherService.upsert([cData]);
    }
    return new Cipher(cData);
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
  deleteCipherAttachmentAdmin(id: string, attachmentId: string): Promise<any> {
    return this.apiService.send(
      "DELETE",
      "/ciphers/" + id + "/attachment/" + attachmentId + "/admin",
      null,
      true,
      false
    );
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

  // Helpers

  private async throwErrorOnSaveAttachmentRawWithServer(e: any) {
    if (e instanceof ErrorResponse) {
      throw new Error((e as ErrorResponse).getSingleMessage());
    } else {
      throw e;
    }
  }

  private async shareAttachmentWithServer(
    attachmentView: AttachmentView,
    cipherId: string,
    organizationId: string
  ): Promise<any> {
    const attachmentResponse = await this.apiService.nativeFetch(
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

    this.createBlobObject(decBuf, encFileName, key);

    try {
      await this.postShareCipherAttachment(cipherId, attachmentView.id, fd, organizationId);
    } catch (e) {
      throw new Error((e as ErrorResponse).getSingleMessage());
    }
  }

  private async createBlobObject(
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
