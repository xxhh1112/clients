import { CachedServices } from "../background/service_factories/factory-options";
import RuntimeMessage from "../types/runtime-messages";

// Can get rid of this when @types/chrome is updated
// Ref: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60530
// Docs: https://developer.chrome.com/docs/extensions/reference/action/#type-OpenPopupOptions
type OpenPopupOptions = {
  windowId?: number;
};

// Docs: https://developer.chrome.com/docs/extensions/reference/action/#method-openPopup
type ExtendedAction = typeof chrome.action & {
  openPopup: (options?: OpenPopupOptions, callback?: () => void) => void;
};

export async function runtimeListener(
  cachedServices: CachedServices,
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender
) {
  switch (message.command) {
    case "promptForLogin":
      await new Promise<void>((resolve, reject) => {
        (chrome.action as ExtendedAction).openPopup({}, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
      break;
  }
}
