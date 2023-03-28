import * as FormData from "form-data";
import { HttpsProxyAgent } from "https-proxy-agent";
import * as fe from "node-fetch";

import { ApiHelperService } from "@bitwarden/common/abstractions/api-helper.service.abstraction";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { TokenApiService } from "@bitwarden/common/auth/abstractions/token-api.service.abstraction";
import { ApiService } from "@bitwarden/common/services/api.service";

(global as any).fetch = fe.default;
(global as any).Request = fe.Request;
(global as any).Response = fe.Response;
(global as any).Headers = fe.Headers;
(global as any).FormData = FormData;

export class NodeApiService extends ApiService {
  constructor(
    platformUtilsService: PlatformUtilsService,
    environmentService: EnvironmentService,
    apiHelperService: ApiHelperService,
    tokenApiService: TokenApiService,
    customUserAgent: string = null
  ) {
    super(
      platformUtilsService,
      environmentService,
      apiHelperService,
      tokenApiService,
      customUserAgent
    );
  }

  nativeFetch(request: Request): Promise<Response> {
    const proxy = process.env.http_proxy || process.env.https_proxy;
    if (proxy) {
      (request as any).agent = new HttpsProxyAgent(proxy);
    }
    return fetch(request);
  }
}
