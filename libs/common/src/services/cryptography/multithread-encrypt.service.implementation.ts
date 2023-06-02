import { EmptyError, filter, firstValueFrom, fromEvent, map, Subject, takeUntil } from "rxjs";
import { Jsonify } from "type-fest";

import { Decryptable } from "../../interfaces/decryptable.interface";
import { InitializerMetadata } from "../../interfaces/initializer-metadata.interface";
import { Utils } from "../../misc/utils";
import { SymmetricCryptoKey } from "../../models/domain/symmetric-crypto-key";

import { EncryptServiceImplementation } from "./encrypt.service.implementation";
import { getClassInitializer } from "./get-class-initializer";

export class MultithreadEncryptServiceImplementation extends EncryptServiceImplementation {
  private worker: Worker;
  private clear$ = new Subject<void>();

  /**
   * Sends items to a web worker to decrypt them.
   * This utilises multithreading to decrypt items faster without interrupting other operations (e.g. updating UI).
   */
  async decryptItems<T extends InitializerMetadata>(
    items: Decryptable<T>[],
    key: SymmetricCryptoKey
  ): Promise<T[]> {
    if (items == null || items.length < 1) {
      return [];
    }

    this.logService.info("Starting decryption using multithreading");

    this.worker ??= new Worker(
      new URL(
        // This is required to get a consistent webpack chunk name. This is particularly important for Safari
        // which needs a consistent file name to include in its bundle. Do not change the next line.
        /* webpackChunkName: 'encrypt-worker' */
        "@bitwarden/common/services/cryptography/encrypt.worker.ts",
        import.meta.url
      )
    );

    const request = {
      id: Utils.newGuid(),
      items: items,
      key: key,
    };

    this.worker.postMessage(JSON.stringify(request));

    return await firstValueFrom(
      fromEvent(this.worker, "message").pipe(
        filter((response: MessageEvent) => response.data?.id === request.id),
        map((response) => JSON.parse(response.data.items)),
        map((items) =>
          items.map((jsonItem: Jsonify<T>) => {
            const initializer = getClassInitializer<T>(jsonItem.initializerKey);
            return initializer(jsonItem);
          })
        ),
        takeUntil(this.clear$)
      )
    ).catch((error: Error) => {
      // If the observable completes early due to takeUntil, it will reject with an EmptyError. This is desirable
      // because any default value may be mistaken for an empty vault by a caller, which could
      // cause data loss for sensitive operations like key rotation.
      if (error instanceof EmptyError) {
        this.logService.info("Decryption has been aborted due to lock or logout.");
        return;
      }

      throw error;
    });
  }

  override clear() {
    // Fulfill the decryptItems promise so that it's not left hanging for a response from the terminated worker
    this.clear$.next();

    // Terminate the worker. This aborts the current script and any queued tasks in the worker:
    // https://html.spec.whatwg.org/multipage/workers.html#terminate-a-worker
    this.worker?.terminate();
    this.worker = null;
  }
}
