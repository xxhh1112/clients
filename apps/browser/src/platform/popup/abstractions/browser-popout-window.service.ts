interface BrowserPopoutWindowService {
  openUnlockPrompt(senderWindowId: number): Promise<void>;
  closeUnlockPrompt(): Promise<void>;
  openViewCipherWindow(
    senderWindowId: number,
    promptData: {
      action: string;
      cipherId: string;
      senderTabId: number;
    }
  ): Promise<void>;
  closeViewCipherWindow(): Promise<void>;
  openAddEditCipherWindow(senderWindowId: number, cipherId?: string): Promise<void>;
  closeAddEditCipherWindow(): Promise<void>;
}

export { BrowserPopoutWindowService };
