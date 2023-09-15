import { BrowserApi } from "../../../platform/browser/browser-api";
import PopoutWindow from "../../../platform/popup/popout-window";

const AuthPopoutType = {
  unlockExtension: "auth_unlockExtension",
  ssoAuthResult: "auth_ssoAuthResult",
  twoFactorAuth: "auth_twoFactorAuth",
} as const;

async function openUnlockPopout(senderTab: chrome.tabs.Tab) {
  await PopoutWindow.open("popup/index.html?uilocation=popout", {
    singleActionKey: AuthPopoutType.unlockExtension,
    senderWindowId: senderTab.windowId,
  });
  await BrowserApi.tabSendMessageData(senderTab, "bgUnlockPopoutOpened");
}

async function closeUnlockPopout() {
  await PopoutWindow.closeSingleAction(AuthPopoutType.unlockExtension);
}

async function openSsoAuthResultPopout(resultData: { code: string; state: string }) {
  const { code, state } = resultData;
  const authResultUrl = `popup/index.html?uilocation=popout#/sso?code=${encodeURIComponent(
    code
  )}&state=${encodeURIComponent(state)}`;

  await PopoutWindow.open(authResultUrl, {
    singleActionKey: AuthPopoutType.ssoAuthResult,
  });
}

async function openTwoFactorAuthPopout(twoFactorAuthData: { data: string; remember: string }) {
  const { data, remember } = twoFactorAuthData;
  const params =
    `webAuthnResponse=${encodeURIComponent(data)};` + `remember=${encodeURIComponent(remember)}`;
  const twoFactorUrl = `popup/index.html#/2fa;${params}`;

  await PopoutWindow.open(twoFactorUrl, { singleActionKey: AuthPopoutType.twoFactorAuth });
}

async function closeTwoFactorAuthPopout() {
  await PopoutWindow.closeSingleAction(AuthPopoutType.twoFactorAuth);
}

export {
  AuthPopoutType,
  openUnlockPopout,
  closeUnlockPopout,
  openSsoAuthResultPopout,
  openTwoFactorAuthPopout,
  closeTwoFactorAuthPopout,
};
