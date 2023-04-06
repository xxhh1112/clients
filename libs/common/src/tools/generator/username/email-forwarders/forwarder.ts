import { ApiHelperService } from "../../../../abstractions/api-helper.service.abstraction";

import { ForwarderOptions } from "./forwarder-options";

export interface Forwarder {
  generate(apiHelperService: ApiHelperService, options: ForwarderOptions): Promise<string>;
}
