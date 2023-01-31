import { BehaviorSubject } from "rxjs";

import { Organization } from "@bitwarden/common/models/domain/organization";
import { OrganizationService } from "@bitwarden/common/services/organization/organization.service";

// @browserSession
export class BrowserOrganizationService extends OrganizationService {
  // @sessionSync({ initializer: Organization.fromJSON, initializeAs: "array" })
  protected _organizations: BehaviorSubject<Organization[]>;
}
