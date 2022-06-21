export abstract class UserVerificationPromptService {
  protectedFields: () => string[];
  showUserVerificationPrompt: (
    confirmDescription?: string,
    confirmButtonText?: string,
    modalTitle?: string
  ) => Promise<boolean>;
  enabled: () => Promise<boolean>;
}
