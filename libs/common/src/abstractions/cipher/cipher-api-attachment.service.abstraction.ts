import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { AttachmentRequest } from "@bitwarden/common/models/request/attachmentRequest";
import { CipherShareRequest } from "@bitwarden/common/models/request/cipherShareRequest";
import { AttachmentUploadDataResponse } from "@bitwarden/common/models/response/attachmentUploadDataResponse";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

export class CipherApiAttachmentServiceAbstraction {
  putShareCipher: (id: string, request: CipherShareRequest) => Promise<CipherResponse>;
  /**
   * @deprecated Mar 25 2021: This method has been deprecated in favor of direct uploads.
   * This method still exists for backward compatibility with old server versions.
   */
  postCipherAttachmentLegacy: (id: string, data: FormData) => Promise<CipherResponse>;
  /**
   * @deprecated Mar 25 2021: This method has been deprecated in favor of direct uploads.
   * This method still exists for backward compatibility with old server versions.
   */
  postCipherAttachmentAdminLegacy: (id: string, data: FormData) => Promise<CipherResponse>;
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
  deleteAttachmentWithServer: (id: string, attachmentId: string) => Promise<void>;
  shareWithServer: (
    cipher: CipherView,
    organizationId: string,
    collectionIds: string[]
  ) => Promise<any>;
}
