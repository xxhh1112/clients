import { EncArrayBuffer } from "../models/domain/encArrayBuffer";
import { EncString } from "../models/domain/encString";
import { AttachmentUploadDataResponse } from "../models/response/attachmentUploadDataResponse";
import { SendFileUploadDataResponse } from "../models/response/sendFileUploadDataResponse";

export abstract class FileUploadService {
  uploadSendFile: (
    uploadData: SendFileUploadDataResponse,
    fileName: EncString,
    encryptedFileData: EncArrayBuffer
  ) => Promise<any>;

  uploadCipherAttachment: (
    admin: boolean,
    uploadData: AttachmentUploadDataResponse,
    fileName: EncString,
    encryptedFileData: EncArrayBuffer
  ) => Promise<any>;
  postAttachmentFile: (id: string, attachmentId: string, data: FormData) => Promise<any>;
  renewAttachmentUploadUrl: (
    id: string,
    attachmentId: string
  ) => Promise<AttachmentUploadDataResponse>;
  deleteCipherAttachmentAdmin: (id: string, attachmentId: string) => Promise<any>;
  deleteCipherAttachment: (id: string, attachmentId: string) => Promise<any>;
}
