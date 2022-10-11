import {
  GroupDetailsResponse,
  GroupResponse,
} from "@bitwarden/common/abstractions/group/responses/groupResponse";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";

export class GroupApiServiceAbstraction {
  delete: (orgId: string, groupId: string) => Promise<void>;
  deleteMany: (orgId: string, groupIds: string[]) => Promise<ListResponse<GroupResponse>>;

  get: (orgId: string, groupId: string) => Promise<GroupDetailsResponse>;
  getAll: (orgId: string) => Promise<ListResponse<GroupDetailsResponse>>;
}
