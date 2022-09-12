/* eslint-disable no-console */

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

  const create = async (options?: CredentialCreationOptions) => {
    console.log("[call] create()", options);

    const result = await window.navigator.credentials.create(options);

    console.log("[return] create()", result);

    return result;
  };

  const get = async (options?: CredentialCreationOptions) => {
    console.log("[call] get()", options);

    const result = await window.navigator.credentials.get(options);

    console.log("[return] get()", result);

    return result;
  };

  wCredentials.create = exportAsyncFunction(create);
  wCredentials.get = exportAsyncFunction(get);

  console.log("Bitwarden credentials implementation active");
});
