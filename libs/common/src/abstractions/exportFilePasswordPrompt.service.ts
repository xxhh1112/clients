export abstract class ExportFilePasswordPromptService {
  protectedFields: () => string[];
  showPasswordPrompt: (
    confirmDescription: string,
    confirmButtonText: string,
    modalTitle: string
  ) => Promise<boolean>;
  enabled: () => Promise<boolean>;
}
