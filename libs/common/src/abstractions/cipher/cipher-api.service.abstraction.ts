import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { CipherBulkDeleteRequest } from "@bitwarden/common/models/request/cipherBulkDeleteRequest";
import { CipherBulkMoveRequest } from "@bitwarden/common/models/request/cipherBulkMoveRequest";
import { CipherBulkRestoreRequest } from "@bitwarden/common/models/request/cipherBulkRestoreRequest";
import { CipherBulkShareRequest } from "@bitwarden/common/models/request/cipherBulkShareRequest";
import { CipherCollectionsRequest } from "@bitwarden/common/models/request/cipherCollectionsRequest";
import { CipherCreateRequest } from "@bitwarden/common/models/request/cipherCreateRequest";
import { CipherRequest } from "@bitwarden/common/models/request/cipherRequest";
import { ImportCiphersRequest } from "@bitwarden/common/models/request/importCiphersRequest";
import { ImportOrganizationCiphersRequest } from "@bitwarden/common/models/request/importOrganizationCiphersRequest";
import { SecretVerificationRequest } from "@bitwarden/common/models/request/secretVerificationRequest";
import { CipherResponse } from "@bitwarden/common/models/response/cipherResponse";
import { EventResponse } from "@bitwarden/common/models/response/eventResponse";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

export class CipherApiServiceAbstraction {
  getCipher: (id: string) => Promise<CipherResponse>;
  getFullCipherDetails: (id: string) => Promise<CipherResponse>;
  putCipherCollections: (id: string, request: CipherCollectionsRequest) => Promise<any>;
  saveCollectionsWithServer: (cipher: Cipher) => Promise<any>;
  getCiphersOrganization: (organizationId: string) => Promise<ListResponse<CipherResponse>>;
  postCipher: (request: CipherRequest) => Promise<CipherResponse>;
  putCipher: (id: string, request: CipherRequest) => Promise<CipherResponse>;
  deleteCipher: (id: string) => Promise<any>;
  deleteManyCiphers: (request: CipherBulkDeleteRequest) => Promise<any>;
  postCipherCreate: (request: CipherCreateRequest) => Promise<CipherResponse>;
  putMoveCiphers: (request: CipherBulkMoveRequest) => Promise<any>;
  putShareCiphers: (request: CipherBulkShareRequest) => Promise<any>;
  postPurgeCiphers: (request: SecretVerificationRequest, organizationId?: string) => Promise<any>;
  postImportCiphers: (request: ImportCiphersRequest) => Promise<any>;
  postImportOrganizationCiphers: (
    organizationId: string,
    request: ImportOrganizationCiphersRequest
  ) => Promise<any>;
  putDeleteCipher: (id: string) => Promise<any>;
  putDeleteManyCiphers: (request: CipherBulkDeleteRequest) => Promise<any>;
  putRestoreCipher: (id: string) => Promise<CipherResponse>;
  putRestoreManyCiphers: (
    request: CipherBulkRestoreRequest
  ) => Promise<ListResponse<CipherResponse>>;
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
  moveManyWithServer: (ids: string[], folderId: string) => Promise<any>;
  deleteWithServer: (id: string) => Promise<any>;
  deleteManyWithServer: (ids: string[]) => Promise<any>;
  softDeleteWithServer: (id: string) => Promise<any>;
  softDeleteManyWithServer: (ids: string[]) => Promise<any>;
  restoreWithServer: (id: string) => Promise<any>;
  restoreManyWithServer: (ids: string[]) => Promise<any>;
}
