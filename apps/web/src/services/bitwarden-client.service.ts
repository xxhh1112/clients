import { Injectable } from "@angular/core";

import { TokenService } from "@bitwarden/common/abstractions/token.service";
import { BitwardenClient } from "@bitwarden/sdk/bitwarden_client";

@Injectable()
export class BitwardenClientService {
  private client: BitwardenClient;

  constructor(private tokenService: TokenService) {
    this.client = new BitwardenClient();
  }

  async getClient(): Promise<BitwardenClient> {
    this.client.setToken(await this.tokenService.getToken());
    return this.client;
  }
}
