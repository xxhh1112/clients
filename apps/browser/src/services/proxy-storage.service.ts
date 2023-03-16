import { AbstractStorageService } from "@bitwarden/common/abstractions/storage.service";

import { BrowserApi } from "../browser/browserApi";

export const PROXY_STORAGE_SERVICE_COMMAND = "storageService_proxy";

export class ProxyStorageService extends AbstractStorageService {
  get<T>(key: string): Promise<T> {
    return this.forward("get", key);
  }
  has(key: string): Promise<boolean> {
    return this.forward("has", key);
  }
  save(key: string, obj: any): Promise<any> {
    return this.forward("save", key, obj);
  }
  remove(key: string): Promise<any> {
    return this.forward("remove", key);
  }

  private async forward<T>(method: keyof AbstractStorageService, ...args: unknown[]): Promise<T> {
    const result = await BrowserApi.sendMessageWithResponse<T>(PROXY_STORAGE_SERVICE_COMMAND, {
      method: method,
      args: args,
    });
    return result;
  }
}
