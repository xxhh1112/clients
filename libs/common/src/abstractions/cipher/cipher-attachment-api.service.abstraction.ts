import { Cipher } from "./../../models/domain/cipher";
import { AttachmentRequest } from "./../../models/request/attachmentRequest";
import { CipherBulkShareRequest } from "./../../models/request/cipherBulkShareRequest";
import { CipherShareRequest } from "./../../models/request/cipherShareRequest";
import { AttachmentResponse } from "./../../models/response/attachmentResponse";
import { AttachmentUploadDataResponse } from "./../../models/response/attachmentUploadDataResponse";
import { CipherResponse } from "./../../models/response/cipherResponse";
import { CipherView } from "./../../models/view/cipherView";

export class CipherAttachmentApiServiceAbstraction {
  putShareCipher: (id: string, request: CipherShareRequest) => Promise<CipherResponse>;
  putShareCiphers: (request: CipherBulkShareRequest) => Promise<any>;
  postCipherAttachment: (
    id: string,
    request: AttachmentRequest
  ) => Promise<AttachmentUploadDataResponse>;

  postShareCipherAttachment: (
    id: string,
    attachmentId: string,
    data: FormData,
    organizationId: string
  ) => Promise<any>;
  shareWithServer: (
    cipher: CipherView,
    organizationId: string,
    collectionIds: string[]
  ) => Promise<any>;
  deleteAttachmentWithServer: (id: string, attachmentId: string) => Promise<void>;
  getAttachmentData: (
    cipherId: string,
    attachmentId: string,
    emergencyAccessId?: string
  ) => Promise<AttachmentResponse>;

  shareManyWithServer: (
    ciphers: CipherView[],
    organizationId: string,
    collectionIds: string[]
  ) => Promise<any>;

  saveAttachmentRawWithServer: (
    cipher: Cipher,
    filename: string,
    data: ArrayBuffer,
    admin?: boolean
  ) => Promise<Cipher>;
  saveAttachmentWithServer: (
    cipher: Cipher,
    unencryptedFile: any,
    admin?: boolean
  ) => Promise<Cipher>;
}
