import { Jsonify } from "type-fest";

import { Decryptable, DecryptableDomain } from "../../interfaces/crypto.interface";
import { InitializerMetadata } from "../../interfaces/initializer-metadata.interface";
import { SymmetricCryptoKey } from "../../models/domain/symmetric-crypto-key";
import { ConsoleLogService } from "../../services/consoleLog.service";
import { ContainerService } from "../../services/container.service";
import { WebCryptoFunctionService } from "../../services/webCryptoFunction.service";

import { EncryptServiceImplementation } from "./encrypt.service.implementation";
import { getClass, getClassInitializer } from "./get-class-initializer";
import { InitializerKey } from "./initializer-key";

const workerApi: Worker = self as any;

let inited = false;
let encryptService: EncryptServiceImplementation;

/**
 * Bootstrap the worker environment with services required for decryption
 */
export function init() {
  const cryptoFunctionService = new WebCryptoFunctionService(self);
  const logService = new ConsoleLogService(false);
  encryptService = new EncryptServiceImplementation(cryptoFunctionService, logService, true);

  const bitwardenContainerService = new ContainerService(null, encryptService);
  bitwardenContainerService.attachToGlobal(self);

  inited = true;
}

/**
 * Listen for messages and decrypt their contents
 */
workerApi.addEventListener("message", async (event: { data: string }) => {
  if (!inited) {
    init();
  }

  const request: {
    id: string;
    view: InitializerKey;
    items: Jsonify<InitializerMetadata>[];
    key: Jsonify<SymmetricCryptoKey>;
  } = JSON.parse(event.data);

  const key = SymmetricCryptoKey.fromJSON(request.key);
  const items = request.items.map((jsonItem) => {
    const initializer = getClassInitializer(jsonItem.initializerKey);
    return initializer(jsonItem);
  });

  const view = getClass<Decryptable<unknown, DecryptableDomain> & InitializerMetadata>(
    request.view
  );

  const result = await encryptService.decryptItems(view as any, items as any, key);

  workerApi.postMessage({
    id: request.id,
    items: JSON.stringify(result),
  });
});
