import { SsoPreValidateResponse } from "../models/response/sso-pre-validate.response";

export abstract class SsoApiService {
  preValidateSso: (identifier: string) => Promise<SsoPreValidateResponse>;
}
