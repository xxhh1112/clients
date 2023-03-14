import { AbstractStorageService } from "@bitwarden/common/abstractions/storage.service";

import { BrowserApi } from "../browser/browserApi";
import { PROXY_STORAGE_SERVICE_COMMAND } from "../services/proxy-storage.service";

export function listenForStorageServiceProxyCommands(storageService: AbstractStorageService) {
  BrowserApi.receiveMessage(PROXY_STORAGE_SERVICE_COMMAND, (msg) => {
    const { method, args } = msg;
    return (storageService as any)[method](...args);
  });
}
