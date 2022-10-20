import { Pipe, PipeTransform } from "@angular/core";

import { GroupResponse } from "@bitwarden/common/models/response/group.response";

@Pipe({
  name: "groupNameFromId",
  pure: true,
})
export class GetGroupNameFromIdPipe implements PipeTransform {
  transform(value: string, groups: GroupResponse[]) {
    return groups.find((o) => o.id === value)?.name;
  }
}
