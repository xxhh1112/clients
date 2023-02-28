export function chromePromise<T = unknown>(
  executor: (resolve: (value: T) => void) => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    executor((result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}
