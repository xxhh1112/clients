import { Cipher } from "./../../models/domain/cipher";
import { AttachmentRequest } from "./../../models/request/attachment.request";
import { CipherBulkShareRequest } from "./../../models/request/cipher-bulk-share.request";
import { CipherShareRequest } from "./../../models/request/cipher-share.request";
import { AttachmentUploadDataResponse } from "./../../models/response/attachment-upload-data.response";
import { AttachmentResponse } from "./../../models/response/attachment.response";
import { CipherResponse } from "./../../models/response/cipher.response";
import { CipherView } from "./../../models/view/cipher.view";

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
  deleteCipherAttachmentAdmin: (id: string, attachmentId: string) => Promise<any>;
  deleteCipherAttachment: (id: string, attachmentId: string) => Promise<any>;
}
