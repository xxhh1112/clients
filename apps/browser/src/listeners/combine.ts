import { CachedServices } from "../background/service_factories/factory-options";

type Listener<T extends unknown[]> = (...args: [...T, CachedServices]) => Promise<void>;

const getCache = (startingServices: CachedServices): CachedServices => {
  const services = { ...startingServices };
  return services;
  // FIXME: This is a testing change for evaluating the usage of the cache
  // remove this fully before merging to master
  // return new Proxy(services, {
  //   get: (target, prop, receiver) => {
  //     if (prop in target) {
  //       const cachedService = Reflect.get(target, prop, receiver);
  //       console.log(`Returning cached service for ${String(prop)}`, cachedService);
  //       return cachedService;
  //     }

  //     console.log("Returning undefined for cached service", prop);
  //     return undefined;
  //   }
  // });
};

export const combine = <T extends unknown[]>(
  listeners: Listener<T>[],
  startingServices: CachedServices = {}
) => {
  return async (...args: T) => {
    try {
      const cachedServices = getCache(startingServices);
      for (const listener of listeners) {
        await listener(...[...args, cachedServices]);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  };
};
