import * as FormData from "form-data";
import { HttpsProxyAgent } from "https-proxy-agent";
import * as fe from "node-fetch";

import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { ApiHelperServiceImplementation } from "@bitwarden/common/services/api-helper.service.implementation";

(global as any).fetch = fe.default;
(global as any).Request = fe.Request;
(global as any).Response = fe.Response;
(global as any).Headers = fe.Headers;
(global as any).FormData = FormData;

export class NodeApiHelperServiceImplementation extends ApiHelperServiceImplementation {
  constructor(
    platformUtilsService: PlatformUtilsService,
    environmentService: EnvironmentService,
    logoutCallback: (expired: boolean) => Promise<void>,
    customUserAgent: string = null
  ) {
    super(platformUtilsService, environmentService, logoutCallback, customUserAgent);
  }

  nativeFetch(request: Request): Promise<Response> {
    const proxy = process.env.http_proxy || process.env.https_proxy;
    if (proxy) {
      (request as any).agent = new HttpsProxyAgent(proxy);
    }
    return fetch(request);
  }
}
