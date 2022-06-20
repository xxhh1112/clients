export abstract class UserSecretPromptService {
  protectedFields: () => string[];
  showPasswordPrompt: (
    confirmDescription: string,
    confirmButtonText: string,
    modalTitle: string
  ) => Promise<boolean>;
  enabled: () => Promise<boolean>;
}
