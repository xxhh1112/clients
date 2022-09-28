import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { CipherAttachmentApiServiceAbstraction as CipherAttachmentApiServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-attachment-api.service.abstraction";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { Utils } from "@bitwarden/common/misc/utils";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { EncArrayBuffer } from "@bitwarden/common/models/domain/encArrayBuffer";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { AttachmentRequest } from "@bitwarden/common/models/request/attachmentRequest";
import { CipherBulkShareRequest } from "@bitwarden/common/models/request/cipherBulkShareRequest";
import { CipherShareRequest } from "@bitwarden/common/models/request/cipherShareRequest";
import { AttachmentResponse } from "@bitwarden/common/models/response/attachmentResponse";
import { AttachmentUploadDataResponse } from "@bitwarden/common/models/response/attachmentUploadDataResponse";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { ErrorResponse } from "@bitwarden/common/models/response/errorResponse";
import { AttachmentView } from "@bitwarden/common/models/view/attachmentView";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

export class CipherAttachmentApiService implements CipherAttachmentApiServiceAbstraction {
  constructor(
    private cipherService: CipherService,
    private apiService: ApiService,
    private cryptoService: CryptoService,
    logService: LogService
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

  async renewAttachmentUploadUrl(
    id: string,
    attachmentId: string
  ): Promise<AttachmentUploadDataResponse> {
    const r = await this.apiService.send(
      "GET",
      "/ciphers/" + id + "/attachment/" + attachmentId + "/renew",
      null,
      true,
      true
    );
    return new AttachmentUploadDataResponse(r);
  }

  postAttachmentFile(id: string, attachmentId: string, data: FormData): Promise<any> {
    return this.apiService.send(
      "POST",
      "/ciphers/" + id + "/attachment/" + attachmentId,
      data,
      true,
      false
    );
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

  // Helpers

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
