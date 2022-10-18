import { ApiService } from "../../abstractions/api.service";
import {
  GroupDetailsResponse,
  GroupResponse,
  GroupServiceAbstraction,
} from "../../abstractions/group";
import { ListResponse } from "../../models/response/listResponse";
import { GroupView } from "../../models/view/groupView";

import { OrganizationGroupBulkRequest } from "./requests/organizationGroupBulkRequest";

export class GroupService implements GroupServiceAbstraction {
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

  async deleteMany(orgId: string, groupIds: string[]): Promise<GroupView[]> {
    const request = new OrganizationGroupBulkRequest(groupIds);

    const r = await this.apiService.send(
      "DELETE",
      "/organizations/" + orgId + "/groups",
      request,
      true,
      true
    );
    const listResponse = new ListResponse(r, GroupResponse);

    return listResponse.data?.map((gr) => GroupView.fromResponse(gr)) ?? [];
  }

  async get(orgId: string, groupId: string): Promise<GroupView> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + orgId + "/groups/" + groupId + "/details",
      null,
      true,
      true
    );

    return GroupView.fromResponse(new GroupDetailsResponse(r));
  }

  async getAll(orgId: string): Promise<GroupView[]> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + orgId + "/groups",
      null,
      true,
      true
    );

    const listResponse = new ListResponse(r, GroupDetailsResponse);

    return listResponse.data?.map((gr) => GroupView.fromResponse(gr)) ?? [];
  }
}
