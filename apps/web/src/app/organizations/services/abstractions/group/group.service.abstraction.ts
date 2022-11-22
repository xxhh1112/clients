import { GroupView } from "../../../views/group.view";

export class GroupServiceAbstraction {
  delete: (orgId: string, groupId: string) => Promise<void>;
  deleteMany: (orgId: string, groupIds: string[]) => Promise<GroupView[]>;

  get: (orgId: string, groupId: string) => Promise<GroupView>;
  getAll: (orgId: string) => Promise<GroupView[]>;

  save: (group: GroupView) => Promise<GroupView>;
}
