import { Observable } from "rxjs";

import { ServerConfig } from "./server-config";

export abstract class ConfigServiceAbstraction {
  serverConfig$: Observable<ServerConfig | null>;
  fetchServerConfig: () => Promise<ServerConfig>;
  getFeatureFlagBool: (key: string, defaultValue: boolean) => Promise<boolean>;
  getFeatureFlagString: (key: string, defaultValue: string) => Promise<string>;
  getFeatureFlagNumber: (key: string, defaultValue: number) => Promise<number>;
}
