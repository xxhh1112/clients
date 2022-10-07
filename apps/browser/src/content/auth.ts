/* eslint-disable no-console */

import { authPopupHtml } from "./auth_popup";
import { createCredential } from "./auth_sign";
import { MessageType, Messenger } from "./messenger";

declare function cloneInto<T>(object: T, window: Window, options?: object): T;
declare function exportFunction<T extends unknown[], R>(
  f: (...args: T) => R,
  window: Window
): (...args: T) => R;

const ENABLE_FALLBACK = true;

document.addEventListener("DOMContentLoaded", (event) => {
  const wWindow = (window as any).wrappedJSObject as Window;
  const wCredentials = wWindow.navigator.credentials;

  function exportAsyncFunction<T extends unknown[], R>(f: (...args: T) => Promise<R>) {
    function wrapped(...args: T): Promise<R> {
      return new window.Promise(async (resolve, reject) => {
        try {
          const result = await f(...args);
          resolve(result);
          // Credentials can't be cloned
          // resolve(cloneInto(result, window));
        } catch (ex) {
          reject(cloneInto(ex, window));
        }
      });
    }

    return exportFunction(wrapped, wWindow);
  }

  const addAuthPopup = async (onAbort: () => void) => {
    const el = document.createElement("div");
    el.innerHTML = authPopupHtml;
    document.body.appendChild(el);
    el.onclick = () => {
      el.remove();
      onAbort();
    };
    return el;
  };

  let onApprove: () => void | undefined;

  const create = (options: CredentialCreationOptions): Promise<Credential | null> => {
    console.log("[call] create()", options);

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      function fallback() {
        if (!ENABLE_FALLBACK) {
          return reject(new Error("Authentication aborted by user"));
        }

        window.navigator.credentials
          .create(options)
          .then((credential) => {
            console.log("[fallback-auth] [successful]", credential);
            resolve(credential);
          })
          .catch((err) => {
            console.log("[fallback-auth] [failed]", err);
            reject(err);
          });
      }

      const popup = await addAuthPopup(fallback);

      Messenger.sendMessageToBackground(MessageType.AUTH, {});

      onApprove = async () => {
        const result = await createCredential(options, window.location.origin);
        popup.remove();
        const cloned = cloneInto(result, window, { cloneFunctions: true });
        cloned.getClientExtensionResults = exportFunction(() => cloneInto({}, window), window);
        console.log("clonedResult", cloned);
        resolve(cloned);
      };
    });
  };

  const get = async (options?: CredentialRequestOptions): Promise<Credential | null> => {
    console.log("[call] get()", options);

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      function fallback() {
        if (!ENABLE_FALLBACK) {
          return reject(new Error("Authentication aborted by user"));
        }

        window.navigator.credentials
          .get(options)
          .then((credential) => {
            console.log("[fallback-auth] [successful]", credential);
            resolve(credential);
          })
          .catch((err) => {
            console.log("[fallback-auth] [failed]", err);
            reject(err);
          });
      }

      const popup = await addAuthPopup(fallback);

      Messenger.sendMessageToBackground(MessageType.AUTH, {});

      onApprove = async () => {
        popup.remove();
        reject("Not implemented");
        // const result = await createCredential(options, window.location.origin);
        // popup.remove();
        // const cloned = cloneInto(result, window, { cloneFunctions: true });
        // cloned.getClientExtensionResults = exportFunction(() => cloneInto({}, window), window);
        // console.log("clonedResult", cloned);
        // resolve(cloned);
      };
    });
  };

  wCredentials.create = exportAsyncFunction(create);
  wCredentials.get = exportAsyncFunction(get);

  /* Commands */
  browser.runtime.onMessage.addListener((message, sender) => {
    const { type, data } = message;
    console.log("content-script received:", type, data);

    if (type === "auth-approve" && onApprove) {
      onApprove();
    }
  });

  console.log("Bitwarden credentials implementation active", browser.browserAction);
});
