import { ApiService } from "../../abstractions/api.service";

import { InactiveTwoFactorReponse } from "./models/response/inactive-two-factor.response";
import { ReportsApiServiceAbstraction } from "./reports-api.service.abstraction";

export class ReportsApiService implements ReportsApiServiceAbstraction {
  constructor(private apiService: ApiService) {}

  async getInactiveTwoFactor(): Promise<InactiveTwoFactorReponse> {
    const r = await this.apiService.send("GET", "/reports/inactive-two-factor", null, true, true);
    return new InactiveTwoFactorReponse(r);
  }
}
