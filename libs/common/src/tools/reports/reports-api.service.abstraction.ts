import { InactiveTwoFactorReponse } from "./models/response/inactive-two-factor.response";

export class ReportsApiServiceAbstraction {
  getInactiveTwoFactor: () => Promise<InactiveTwoFactorReponse>;
}
