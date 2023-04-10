import { KeyConnectorUserKeyRequest } from "../models/request/key-connector-user-key.request";
import { KeyConnectorUserKeyResponse } from "../models/response/key-connector-user-key.response";

export abstract class KeyConnectorApiService {
  getUserKeyFromKeyConnector: (keyConnectorUrl: string) => Promise<KeyConnectorUserKeyResponse>;
  postUserKeyToKeyConnector: (
    keyConnectorUrl: string,
    request: KeyConnectorUserKeyRequest
  ) => Promise<void>;
  getKeyConnectorAlive: (keyConnectorUrl: string) => Promise<void>;
}
