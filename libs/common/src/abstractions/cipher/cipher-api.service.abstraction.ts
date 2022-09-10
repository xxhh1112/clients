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
  nativeFetch: (request: Request) => Promise<Response>;
  getAllFromApiForOrganization: (organizationId: string) => Promise<CipherView[]>;
  saveWithServer: (cipher: Cipher) => Promise<any>;

  shareManyWithServer: (
    ciphers: CipherView[],
    organizationId: string,
    collectionIds: string[]
  ) => Promise<any>;

  moveManyWithServer: (ids: string[], folderId: string) => Promise<any>;
  deleteManyWithServer: (ids: string[]) => Promise<any>;
  deleteWithServer: (id: string) => Promise<any>;
  softDeleteWithServer: (id: string) => Promise<any>;
  softDeleteManyWithServer: (ids: string[]) => Promise<any>;
  restoreWithServer: (id: string) => Promise<any>;
  restoreManyWithServer: (ids: string[]) => Promise<any>;
  saveCollectionsWithServer: (cipher: Cipher) => Promise<any>;
}
