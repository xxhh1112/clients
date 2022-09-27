import { SsoConfigApi } from "../../api/ssoConfigApi";

export class OrganizationSsoRequest {
  enabled = false;
  identifier: string;
  data: SsoConfigApi;
}
