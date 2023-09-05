import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";

interface BrowserPopoutWindowService {
  openUnlockPrompt(senderWindowId: number): Promise<void>;
  closeUnlockPrompt(): Promise<void>;
  openPasswordRepromptPrompt(
    senderWindowId: number,
    promptData: {
      action: string;
      cipherId: string;
      senderTabId: number;
    }
  ): Promise<void>;
  openCipherCreation(
    senderWindowId: number,
    promptData: {
      cipherType: CipherType;
      senderTabId: number;
    }
  ): Promise<void>;
  closePasswordRepromptPrompt(): Promise<void>;
}

export { BrowserPopoutWindowService };
