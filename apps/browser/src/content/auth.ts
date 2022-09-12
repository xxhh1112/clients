/* eslint-disable no-console */

import { authPopupHtml } from "./auth_popup";
import { MessageType, Messenger } from "./messenger";

declare function cloneInto<T>(object: T, window: Window): T;
declare function exportFunction<T extends unknown[], R>(
  f: (...args: T) => R,
  window: Window
): (...args: T) => R;

document.addEventListener("DOMContentLoaded", (event) => {
  const wWindow = (window as any).wrappedJSObject as Window;
  const wCredentials = wWindow.navigator.credentials;

  function exportAsyncFunction<T extends unknown[], R>(f: (...args: T) => Promise<R>) {
    function wrapped(...args: T): Promise<R> {
      return new window.Promise(async (resolve, reject) => {
        try {
          const result = await f(...args);
          resolve(cloneInto(result, window));
        } catch (ex) {
          reject(cloneInto(ex, window));
        }
      });
    }

    return exportFunction(wrapped, wWindow);
  }

  const addAuthPopup = async () => {
    const el = document.createElement("div");
    el.innerHTML = authPopupHtml;
    document.body.appendChild(el);
    return el;
  };

  const create = async (options?: CredentialCreationOptions) => {
    console.log("[call] create()", options);

    addAuthPopup();

    await Messenger.sendMessageToBackground(MessageType.AUTH, {});

    // const result = await window.navigator.credentials.create(options);

    // console.log("[return] create()", result);

    // return result;
    throw new Error("Native fallback disabled");
  };

  const get = async (options?: CredentialCreationOptions) => {
    console.log("[call] get()", options);

    const result = await window.navigator.credentials.get(options);

    console.log("[return] get()", result);

    return result;
  };

  wWindow.addAuthPopup = exportAsyncFunction(addAuthPopup);
  wCredentials.create = exportAsyncFunction(create);
  wCredentials.get = exportAsyncFunction(get);

  /* Commands */

  browser.runtime.onMessage.addListener((message, sender) => {
    const { type, data } = message;
    console.log("content-script received:", type, data);
    // return this.requests.get(type)(sender, data);
  });

  console.log("Bitwarden credentials implementation active", browser.browserAction);
});
