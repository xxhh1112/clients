import { CipherBulkDeleteRequest } from "./../../models/request/cipherBulkDeleteRequest";
import { CipherCollectionsRequest } from "./../../models/request/cipherCollectionsRequest";
import { CipherCreateRequest } from "./../../models/request/cipherCreateRequest";
import { CipherRequest } from "./../../models/request/cipherRequest";
import { CipherResponse } from "./../../models/response/cipherResponse";
import { ListResponse } from "./../../models/response/listResponse";
import { CipherView } from "./../../models/view/cipherView";

export class CipherAdminServiceAbstraction {
  getOrganizationCipherViews: (organizationId: string) => Promise<CipherView[]>;
  getOrganizationCiphers: (organizationId: string) => Promise<ListResponse<CipherResponse>>;
  putCipherCollectionsAdmin: (id: string, request: CipherCollectionsRequest) => Promise<any>;
  getCipherAdmin: (id: string) => Promise<CipherResponse>;
  postCipherAdmin: (request: CipherCreateRequest) => Promise<CipherResponse>;
  putCipherAdmin: (id: string, request: CipherRequest) => Promise<CipherResponse>;
  deleteCipherAdmin: (id: string) => Promise<any>;
  deleteManyCiphersAdmin: (request: CipherBulkDeleteRequest) => Promise<any>;
  putDeleteCipherAdmin: (id: string) => Promise<any>;
  putDeleteManyCiphersAdmin: (request: CipherBulkDeleteRequest) => Promise<any>;
  putRestoreCipherAdmin: (id: string) => Promise<CipherResponse>;
}
