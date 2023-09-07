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
  openFido2Popout(
    senderWindowId: number,
    promptData: {
      sessionId: string;
      senderTabId: number;
    }
  ): Promise<void>;
  closeFido2Popout(): Promise<void>;
}

export { BrowserPopoutWindowService };
