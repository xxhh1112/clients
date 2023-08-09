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
    BrowserApi.sendMessage(this.fromForegroundMessageName, value);
  }

  async init(): Promise<this> {
    await new Promise<void>((resolve) => {
      BrowserApi.sendMessage(this.requestInitMessageName, null, (response) => {
        super.next(this.initializer(response));
        resolve();
      });
    });

    return this;
  }
}
