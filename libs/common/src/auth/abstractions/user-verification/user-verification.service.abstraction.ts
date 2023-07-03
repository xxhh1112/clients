import { Verification } from "../../../types/verification";
import { SecretVerificationRequest } from "../../models/request/secret-verification.request";

export abstract class UserVerificationService {
  buildRequest: <T extends SecretVerificationRequest>(
    verification: Verification,
    requestClass?: new () => T,
    alreadyHashed?: boolean
  ) => Promise<T>;
  verifyUser: (verification: Verification) => Promise<boolean>;
  requestOTP: () => Promise<void>;
  /**
   * Check if user has master password or only uses passwordless technologies to log in
   * @returns True if the user has a master password
   */
  hasMasterPassword: () => Promise<boolean>;
}
