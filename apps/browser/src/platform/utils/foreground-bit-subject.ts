import { DeepJsonify } from "@bitwarden/common/types/deep-jsonify";

import { BrowserApi } from "../browser/browser-api";

import { BrowserBitSubject } from "./browser-bit-subject";

export class ForegroundBitSubject<T = never> extends BrowserBitSubject<T> {
  constructor(serviceObservableName: string, initializer: (json: DeepJsonify<T>) => T) {
    super(serviceObservableName, initializer);

    BrowserApi.messageListener(
      this.fromBackgroundMessageName,
      (message: { command: string; data: DeepJsonify<T> }) => {
        if (message.command !== this.fromBackgroundMessageName) {
          return;
        }

        super.next(initializer(message.data));
      }
    );
  }

  override next(value: T): void {
    // Do not next the subject, background does it first, then tells us to
    BrowserApi.sendMessage(this.fromForegroundMessageName, { data: value });
  }

  async init(fallbackInitialValue?: T): Promise<this> {
    // Initialize from background without waiting for a new emit
    await new Promise<void>((resolve) => {
      BrowserApi.sendMessage(this.requestInitMessageName, null, (response) => {
        if (response === undefined) {
          // did not receive a response
          response = fallbackInitialValue;
        }

        super.next(this.initializer(response));
        resolve();
      });
    });

    return this;
  }
}
