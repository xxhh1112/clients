import { CipherAttachmentApiServiceAbstraction } from "@bitwarden/common/abstractions/cipher/cipher-attachment-api.service.abstraction";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { AttachmentRequest } from "@bitwarden/common/models/request/attachmentRequest";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { ErrorResponse } from "@bitwarden/common/models/response/errorResponse";

import { ApiService } from "../abstractions/api.service";
import { CipherService } from "../abstractions/cipher.service";
import { FileUploadService as FileUploadServiceAbstraction } from "../abstractions/fileUpload.service";
import { LogService } from "../abstractions/log.service";
import { FileUploadType } from "../enums/fileUploadType";
import { EncArrayBuffer } from "../models/domain/encArrayBuffer";
import { EncString } from "../models/domain/encString";
import { AttachmentUploadDataResponse } from "../models/response/attachmentUploadDataResponse";
import { SendFileUploadDataResponse } from "../models/response/sendFileUploadDataResponse";

import { AzureFileUploadService } from "./azureFileUpload.service";
import { BitwardenFileUploadService } from "./bitwardenFileUpload.service";

export class FileUploadService implements FileUploadServiceAbstraction {
  private azureFileUploadService: AzureFileUploadService;
  private bitwardenFileUploadService: BitwardenFileUploadService;

  constructor(
    private logService: LogService,
    private apiService: ApiService,
    private cipherAttachmentApiService: CipherAttachmentApiServiceAbstraction,
    private cipherService: CipherService,
    private cryptoService: CryptoService
  ) {
    this.azureFileUploadService = new AzureFileUploadService(logService);
    this.bitwardenFileUploadService = new BitwardenFileUploadService();
  }

  async uploadSendFile(
    uploadData: SendFileUploadDataResponse,
    fileName: EncString,
    encryptedFileData: EncArrayBuffer
  ) {
    try {
      switch (uploadData.fileUploadType) {
        case FileUploadType.Direct:
          await this.bitwardenFileUploadService.upload(
            fileName.encryptedString,
            encryptedFileData,
            (fd) =>
              this.apiService.postSendFile(
                uploadData.sendResponse.id,
                uploadData.sendResponse.file.id,
                fd
              )
          );
          break;
        case FileUploadType.Azure: {
          const renewalCallback = async () => {
            const renewalResponse = await this.apiService.renewSendFileUploadUrl(
              uploadData.sendResponse.id,
              uploadData.sendResponse.file.id
            );
            return renewalResponse.url;
          };
          await this.azureFileUploadService.upload(
            uploadData.url,
            encryptedFileData,
            renewalCallback
          );
          break;
        }
        default:
          throw new Error("Unknown file upload type");
      }
    } catch (e) {
      await this.apiService.deleteSend(uploadData.sendResponse.id);
      throw e;
    }
  }

  async uploadCipherAttachment(
    admin: boolean,
    uploadData: AttachmentUploadDataResponse,
    encryptedFileName: EncString,
    encryptedFileData: EncArrayBuffer
  ) {
    const response = admin ? uploadData.cipherMiniResponse : uploadData.cipherResponse;
    try {
      switch (uploadData.fileUploadType) {
        case FileUploadType.Direct:
          await this.bitwardenFileUploadService.upload(
            encryptedFileName.encryptedString,
            encryptedFileData,
            (fd) =>
              this.cipherAttachmentApiService.postAttachmentFile(
                response.id,
                uploadData.attachmentId,
                fd
              )
          );
          break;
        case FileUploadType.Azure: {
          const renewalCallback = async () => {
            const renewalResponse = await this.cipherAttachmentApiService.renewAttachmentUploadUrl(
              response.id,
              uploadData.attachmentId
            );
            return renewalResponse.url;
          };
          await this.azureFileUploadService.upload(
            uploadData.url,
            encryptedFileData,
            renewalCallback
          );
          break;
        }
        default:
          throw new Error("Unknown file upload type.");
      }
    } catch (e) {
      if (admin) {
        await this.cipherAttachmentApiService.deleteCipherAttachmentAdmin(
          response.id,
          uploadData.attachmentId
        );
      } else {
        await this.cipherAttachmentApiService.deleteCipherAttachment(
          response.id,
          uploadData.attachmentId
        );
      }
      throw e;
    }
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
      const uploadDataResponse = await this.cipherAttachmentApiService.postCipherAttachment(
        cipher.id,
        request
      );
      response = admin ? uploadDataResponse.cipherMiniResponse : uploadDataResponse.cipherResponse;
      await this.uploadCipherAttachment(admin, uploadDataResponse, encFileName, encData);
    } catch (e) {
      await this.throwErrorOnSaveAttachmentRawWithServer(e);
    }

    const cData = new CipherData(response, cipher.collectionIds);
    if (!admin) {
      await this.cipherService.upsert(cData);
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

  private async throwErrorOnSaveAttachmentRawWithServer(e: any) {
    if (e instanceof ErrorResponse) {
      throw new Error((e as ErrorResponse).getSingleMessage());
    } else {
      throw e;
    }
  }
}
