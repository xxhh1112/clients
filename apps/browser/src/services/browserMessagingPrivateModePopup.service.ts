import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";

export default class BrowserMessagingPrivateModePopupService implements MessagingService {
  send(subscriber: string, arg: any = {}) {
    const message = Object.assign({}, { command: subscriber }, arg);
    (window as any).bitwardenBackgroundMessageListener(message);
    // Also send the message to the background service worker in case there is one
    chrome.runtime.sendMessage(message);
  }
}
