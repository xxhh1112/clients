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
  deleteCipherAttachment: (id: string, attachmentId: string) => Promise<any>;
  deleteCipherAttachmentAdmin: (id: string, attachmentId: string) => Promise<any>;
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

  renewAttachmentUploadUrl: (
    id: string,
    attachmentId: string
  ) => Promise<AttachmentUploadDataResponse>;
  postAttachmentFile: (id: string, attachmentId: string, data: FormData) => Promise<any>;
  shareManyWithServer: (
    ciphers: CipherView[],
    organizationId: string,
    collectionIds: string[]
  ) => Promise<any>;
}
