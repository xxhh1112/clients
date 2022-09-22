import MainBackground from "./background/main.background";
import { BrowserApi } from "./browser/browserApi";
import { MessageType, Messenger } from "./content/messenger";
// import { MessageType, Messenger } from "./content/messenger";
import { onCommandListener } from "./listeners/onCommandListener";
import { onInstallListener } from "./listeners/onInstallListener";

const manifest = chrome.runtime.getManifest();

if (manifest.manifest_version === 3) {
  chrome.commands.onCommand.addListener(onCommandListener);
  chrome.runtime.onInstalled.addListener(onInstallListener);
} else {
  const bitwardenMain = ((window as any).bitwardenMain = new MainBackground());
  bitwardenMain.bootstrap().then(() => {
    // Finished bootstrapping
  });
}

browser.runtime.onMessage.addListener(async (message, sender) => {
  const { type, data } = message;

  console.log("background received:", type, data);

  if (type === MessageType.AUTH) {
    browser.browserAction.setPopup({ popup: "popup/index.html#/auth" });
  }

  if (type === MessageType.AUTH_APPROVE_POPUP) {
    const tab = await BrowserApi.getTabFromCurrentWindowId();
    Messenger.sendMessageToContentScript(tab.id, MessageType.AUTH_APPROVE, {});
  }
});
