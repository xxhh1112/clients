import { UriMatchType } from "@bitwarden/common/enums/uriMatchType";
import { LoginUriView } from "@bitwarden/common/models/view/loginUriView";
export type filterUriMatchTypeRequest = {
  loginUriView: LoginUriView;
  defaultMatch: UriMatchType;
  domain: string;
  matchingDomains: any;
  url: string;
};
