import { EncArrayBuffer } from "../models/domain/encArrayBuffer";
import { EncString } from "../models/domain/encString";
import { SendFileUploadDataResponse } from "../models/response/sendFileUploadDataResponse";

export abstract class FileUploadService {
  uploadSendFile: (
    uploadData: SendFileUploadDataResponse,
    fileName: EncString,
    encryptedFileData: EncArrayBuffer
  ) => Promise<any>;
}
