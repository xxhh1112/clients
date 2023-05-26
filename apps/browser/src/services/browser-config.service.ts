import { BehaviorSubject } from "rxjs";

import { ConfigApiServiceAbstraction } from "@bitwarden/common/abstractions/config/config-api.service.abstraction";
import { ServerConfig } from "@bitwarden/common/abstractions/config/server-config";
import { EnvironmentService } from "@bitwarden/common/abstractions/environment.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { ConfigService } from "@bitwarden/common/services/config/config.service";

import { browserSession, sessionSync } from "../decorators/session-sync-observable";

@browserSession
export class BrowserConfigService extends ConfigService {
  @sessionSync<ServerConfig>({ initializer: ServerConfig.fromJSON })
  protected _serverConfig: BehaviorSubject<ServerConfig | null>;

  constructor(
    stateService: StateService,
    configApiService: ConfigApiServiceAbstraction,
    authService: AuthService,
    environmentService: EnvironmentService,
    subscribe = false
  ) {
    super(stateService, configApiService, authService, environmentService, subscribe);
  }
}
