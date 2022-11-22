import { GroupResponse } from "../../abstractions/group";
import { SelectionReadOnlyResponse } from "../response/selection-read-only.response";

import { View } from "./view";

export class GroupView implements View {
  id: string;
  organizationId: string;
  name: string;
  accessAll: boolean;
  externalId: string;
  collections: SelectionReadOnlyResponse[] = [];

  static fromResponse(response: GroupResponse) {
    return Object.assign(new GroupView(), response);
  }
}
