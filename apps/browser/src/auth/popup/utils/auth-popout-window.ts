import { BrowserApi } from "../../../platform/browser/browser-api";
import BrowserPopupUtils from "../../../platform/popup/browser-popup-utils";

const AuthPopoutType = {
  unlockExtension: "auth_unlockExtension",
  ssoAuthResult: "auth_ssoAuthResult",
  twoFactorAuth: "auth_twoFactorAuth",
} as const;

/**
 * Opens a window that facilitates unlocking / logging into the extension.
 * @param senderTab Used to determine the windowId of the sender.
 * @param data Used to determine whether to show the unlock notification.
 */
async function openUnlockPopout(senderTab: chrome.tabs.Tab, data?: Record<string, any>) {
  await BrowserPopupUtils.openPopout("popup/index.html", {
    singleActionKey: AuthPopoutType.unlockExtension,
    senderWindowId: senderTab.windowId,
  });
  await BrowserApi.tabSendMessageData(senderTab, "bgUnlockPopoutOpened", data);
}

/**
 * Closes the unlock popout window.
 */
async function closeUnlockPopout() {
  await BrowserPopupUtils.closeSingleActionPopout(AuthPopoutType.unlockExtension);
}

/**
 * Opens a window that facilitates presenting the results for SSO authentication.
 * @param resultData The result data from the SSO authentication.
 */
async function openSsoAuthResultPopout(resultData: { code: string; state: string }) {
  const { code, state } = resultData;
  const authResultUrl = `popup/index.html#/sso?code=${encodeURIComponent(
    code
  )}&state=${encodeURIComponent(state)}`;

  await BrowserPopupUtils.openPopout(authResultUrl, {
    singleActionKey: AuthPopoutType.ssoAuthResult,
  });
}

/**
 * Opens a window that facilitates two-factor authentication.
 * @param twoFactorAuthData The data from the two-factor authentication.
 */
async function openTwoFactorAuthPopout(twoFactorAuthData: { data: string; remember: string }) {
  const { data, remember } = twoFactorAuthData;
  const params =
    `webAuthnResponse=${encodeURIComponent(data)};` + `remember=${encodeURIComponent(remember)}`;
  const twoFactorUrl = `popup/index.html#/2fa;${params}`;

  await BrowserPopupUtils.openPopout(twoFactorUrl, {
    singleActionKey: AuthPopoutType.twoFactorAuth,
  });
}

/**
 * Closes the two-factor authentication popout window.
 */
async function closeTwoFactorAuthPopout() {
  await BrowserPopupUtils.closeSingleActionPopout(AuthPopoutType.twoFactorAuth);
}

export {
  AuthPopoutType,
  openUnlockPopout,
  closeUnlockPopout,
  openSsoAuthResultPopout,
  openTwoFactorAuthPopout,
  closeTwoFactorAuthPopout,
};
