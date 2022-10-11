import { ApiService } from "@bitwarden/common/abstractions/api.service";
import {
  GroupApiServiceAbstraction,
  GroupDetailsResponse,
  GroupResponse,
} from "@bitwarden/common/abstractions/group";
import { OrganizationGroupBulkRequest } from "@bitwarden/common/models/request/OrganizationGroupBulkRequest";
import { ListResponse } from "@bitwarden/common/models/response/listResponse";

export class GroupApiService implements GroupApiServiceAbstraction {
  constructor(private apiService: ApiService) {}

  async delete(orgId: string, groupId: string): Promise<void> {
    await this.apiService.send(
      "DELETE",
      "/organizations/" + orgId + "/groups/" + groupId,
      null,
      true,
      false
    );
  }

  async deleteMany(orgId: string, groupIds: string[]): Promise<ListResponse<GroupResponse>> {
    const request = new OrganizationGroupBulkRequest(groupIds);

    const r = await this.apiService.send(
      "DELETE",
      "/organizations/" + orgId + "/groups",
      request,
      true,
      true
    );

    return new ListResponse(r, GroupResponse);
  }

  async get(orgId: string, groupId: string): Promise<GroupDetailsResponse> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + orgId + "/groups/" + groupId + "/details",
      null,
      true,
      true
    );

    return new GroupDetailsResponse(r);
  }

  async getAll(orgId: string): Promise<ListResponse<GroupDetailsResponse>> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + orgId + "/groups",
      null,
      true,
      true
    );

    return new ListResponse(r, GroupDetailsResponse);
  }
}
