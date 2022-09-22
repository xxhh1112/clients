/* eslint-disable no-console */
export enum MessageType {
  AUTH = "auth",
  AUTH_APPROVE = "auth-approve",
  AUTH_APPROVE_POPUP = "auth-approve-popup",
}

export const Messenger = {
  /**
   * Send a message to Background script
   *
   * @param {BackgroundMessage} type Background Message Type
   * @param {*} [data=null]
   * @return {*}
   */
  async sendMessageToBackground(type: any, data: unknown) {
    try {
      const response = await browser.runtime.sendMessage({ type, data });
      return response;
    } catch (error) {
      console.error("sendMessageToBackground error: ", error);
      return null;
    }
  },

  /**
   * Send a message to Content Script of a Tab
   *
   * @param {number} tabID Tab ID
   * @param {ContentScriptMessage} type
   * @param {*} [data=null]
   * @return {*}
   */
  async sendMessageToContentScript(tabID: number, type: any, data: unknown) {
    try {
      // Notice the API difference - browser.tabs to send to content script but browser.runtime to send to background.
      const response = await browser.tabs.sendMessage(tabID, { type, data });
      console.log("response:", response);
      return response;
    } catch (error) {
      console.error("sendMessageToContentScript error: ", error);
      return null;
    }
  },
};
