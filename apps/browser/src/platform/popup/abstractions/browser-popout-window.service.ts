interface BrowserPopoutWindowService {
  openUnlockPopout(senderWindowId: number): Promise<void>;
  closeUnlockPopout(): Promise<void>;
  openPasswordRepromptPopout(
    senderWindowId: number,
    promptData: {
      action: string;
      cipherId: string;
      senderTabId: number;
    }
  ): Promise<void>;
  closePasswordRepromptPrompt(): Promise<void>;
}

export { BrowserPopoutWindowService };
