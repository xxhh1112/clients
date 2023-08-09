interface BrowserPopoutWindowService {
  openLoginPrompt(senderWindowId: number): Promise<void>;
  closeLoginPrompt(): Promise<void>;
  openAddEditCipherWindow(senderWindowId: number, cipherId?: string): Promise<void>;
  closeAddEditCipherWindow(): Promise<void>;
}

export { BrowserPopoutWindowService };
