import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { AttachmentRequest } from "@bitwarden/common/models/request/attachmentRequest";
import { CipherBulkDeleteRequest } from "@bitwarden/common/models/request/cipherBulkDeleteRequest";
import { CipherBulkMoveRequest } from "@bitwarden/common/models/request/cipherBulkMoveRequest";
import { CipherBulkRestoreRequest } from "@bitwarden/common/models/request/cipherBulkRestoreRequest";
import { CipherBulkShareRequest } from "@bitwarden/common/models/request/cipherBulkShareRequest";
import { CipherCollectionsRequest } from "@bitwarden/common/models/request/cipherCollectionsRequest";
import { CipherCreateRequest } from "@bitwarden/common/models/request/cipherCreateRequest";
import { CipherRequest } from "@bitwarden/common/models/request/cipherRequest";
import { CipherShareRequest } from "@bitwarden/common/models/request/cipherShareRequest";
import { ImportCiphersRequest } from "@bitwarden/common/models/request/importCiphersRequest";
import { ImportOrganizationCiphersRequest } from "@bitwarden/common/models/request/importOrganizationCiphersRequest";
import { SecretVerificationRequest } from "@bitwarden/common/models/request/secretVerificationRequest";
import { AttachmentUploadDataResponse } from "@bitwarden/common/models/response/attachmentUploadDataResponse";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { EventResponse } from "@bitwarden/common/models/response/eventResponse";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

export class CipherApiServiceAbstraction {
  getCipher: (id: string) => Promise<CipherResponse>;
  getFullCipherDetails: (id: string) => Promise<CipherResponse>;
  getCiphersOrganization: (organizationId: string) => Promise<ListResponse<CipherResponse>>;
  postCipher: (request: CipherRequest) => Promise<CipherResponse>;
  postCipherCreate: (request: CipherCreateRequest) => Promise<CipherResponse>;
  putCipher: (id: string, request: CipherRequest) => Promise<CipherResponse>;
  deleteCipher: (id: string) => Promise<any>;
  deleteManyCiphers: (request: CipherBulkDeleteRequest) => Promise<any>;
  putMoveCiphers: (request: CipherBulkMoveRequest) => Promise<any>;
  putShareCipher: (id: string, request: CipherShareRequest) => Promise<CipherResponse>;
  putShareCiphers: (request: CipherBulkShareRequest) => Promise<any>;
  putCipherCollections: (id: string, request: CipherCollectionsRequest) => Promise<any>;
  postPurgeCiphers: (request: SecretVerificationRequest, organizationId?: string) => Promise<any>;
  postImportCiphers: (request: ImportCiphersRequest) => Promise<any>;
  postImportOrganizationCiphers: (
    organizationId: string,
    request: ImportOrganizationCiphersRequest
  ) => Promise<any>;
  putDeleteCipher: (id: string) => Promise<any>;
  putRestoreManyCiphers: (
    request: CipherBulkRestoreRequest
  ) => Promise<ListResponse<CipherResponse>>;

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
  nativeFetch: (request: Request) => Promise<Response>;
  getEventsCipher: (
    id: string,
    start: string,
    end: string,
    token: string
  ) => Promise<ListResponse<EventResponse>>;
  saveWithServer: (cipher: Cipher) => Promise<any>;

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

  saveCollectionsWithServer: (cipher: Cipher) => Promise<any>;

  moveManyWithServer: (ids: string[], folderId: string) => Promise<any>;

  deleteWithServer: (id: string) => Promise<any>;
  deleteManyWithServer: (ids: string[]) => Promise<any>;
  softDeleteWithServer: (id: string) => Promise<any>;
  softDeleteManyWithServer: (ids: string[]) => Promise<any>;
  restoreWithServer: (id: string) => Promise<any>;
  restoreManyWithServer: (ids: string[]) => Promise<any>;
}
