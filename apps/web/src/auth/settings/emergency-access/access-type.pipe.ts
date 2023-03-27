import { Pipe, PipeTransform } from "@angular/core";

import { EmergencyAccessType } from "@bitwarden/common/auth/enums/emergency-access-type";

@Pipe({
  name: "appEmergencyAccessType",
})
export class AccessTypePipe implements PipeTransform {
  transform(value: EmergencyAccessType, ...args: any[]): any {
    switch (value) {
      case EmergencyAccessType.View:
        return "view";
      case EmergencyAccessType.Takeover:
        return "takeover";
    }
  }
}
