import { BitwardenClient } from "@bitwarden/sdk-client";

export abstract class BitwardenSdkServiceAbstraction {
  getClient: () => Promise<BitwardenClient>;
}
