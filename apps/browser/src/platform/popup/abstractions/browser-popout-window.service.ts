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
  closePasswordRepromptPrompt(): Promise<void>;
  openAddEditCipherWindow(senderWindowId: number, cipherId?: string): Promise<void>;
  closeAddEditCipherWindow(): Promise<void>;
  openViewCipherWindow(senderWindowId: number, cipherId: string): Promise<void>;
  closeViewCipherWindow(): Promise<void>;
}

export { BrowserPopoutWindowService };
