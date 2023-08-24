import MainBackground from "../../../background/main.background";
import { BrowserApi } from "../../browser/browser-api";

export type CachedServices = Partial<MainBackground>;
export type mainKeys = keyof MainBackground;

export type FactoryOptions = {
  alwaysInitializeNewService?: boolean;
  doNotStoreInitializedService?: boolean;
  [optionsKey: string]: unknown;
};

export async function factory<
  TCache extends CachedServices,
  TName extends keyof TCache,
  TOpts extends FactoryOptions
>(
  cachedServices: TCache,
  name: TName,
  opts: TOpts,
  factory: () => TCache[TName] | Promise<TCache[TName]>
): Promise<TCache[TName]> {
  const background = BrowserApi.getBackgroundPage();
  if (BrowserApi.manifestVersion !== 3 && background?.bitwardenMain?.[name] != null) {
    return background.bitwardenMain[name] as TCache[TName];
  }
  let instance = cachedServices[name];
  if (opts.alwaysInitializeNewService || !instance) {
    const instanceOrPromise = factory();
    instance = instanceOrPromise instanceof Promise ? await instanceOrPromise : instanceOrPromise;
  }

  if (!opts.doNotStoreInitializedService) {
    cachedServices[name] = instance;
  }

  return instance as TCache[TName];
}
