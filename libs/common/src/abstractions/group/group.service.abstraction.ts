import { GroupView } from "../../models/view/groupView";

export class GroupServiceAbstraction {
  delete: (orgId: string, groupId: string) => Promise<void>;
  deleteMany: (orgId: string, groupIds: string[]) => Promise<GroupView[]>;

  get: (orgId: string, groupId: string) => Promise<GroupView>;
  getAll: (orgId: string) => Promise<GroupView[]>;
}
