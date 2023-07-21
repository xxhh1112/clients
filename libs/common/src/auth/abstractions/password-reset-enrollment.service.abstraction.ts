import { UserKey } from "../../platform/models/domain/symmetric-crypto-key";

export abstract class PasswordResetEnrollmentServiceAbstraction {
  /**
   * Enroll current user in password reset
   * @param organizationId - Organization in which to enroll the user
   * @returns Promise that resolves when the user is enrolled
   * @throws Error if the action fails
   */
  abstract enroll(organizationId: string): Promise<void>;

  /**
   * Enroll user in password reset
   * @param organizationId - Organization in which to enroll the user
   * @param userId - User to enroll
   * @param userKey - User's symmetric key
   * @returns Promise that resolves when the user is enrolled
   * @throws Error if the action fails
   */
  abstract enroll(organizationId: string, userId: string, userKey: UserKey): Promise<void>;
}
