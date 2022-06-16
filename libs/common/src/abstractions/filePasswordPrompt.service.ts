export abstract class FilePasswordPromptService {
  protectedFields: () => string[];
  showPasswordPrompt: (fcontents: string, organizationId: string) => Promise<boolean>;
  enabled: () => Promise<boolean>;
}
