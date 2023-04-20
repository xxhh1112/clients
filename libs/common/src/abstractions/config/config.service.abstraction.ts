import { Observable } from "rxjs";

import { ServerConfig } from "./server-config";
import { FeatureFlag } from "../../enums/feature-flags.enum";

export abstract class ConfigServiceAbstraction {
  serverConfig$: Observable<ServerConfig | null>;
  fetchServerConfig: () => Promise<ServerConfig>;
  getFeatureFlagBool: (key: FeatureFlag, defaultValue: boolean) => Promise<boolean>;
  getFeatureFlagString: (key: FeatureFlag, defaultValue: string) => Promise<string>;
  getFeatureFlagNumber: (key: FeatureFlag, defaultValue: number) => Promise<number>;
}
