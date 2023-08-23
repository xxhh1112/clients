import { Subscription } from "rxjs";

import { Utils } from "@bitwarden/common/platform/misc/utils";
import { DeepJsonify } from "@bitwarden/common/types/deep-jsonify";

import { BrowserBitSubject } from "./browser-bit-subject";

export class BackgroundBitSubject<T = never> extends BrowserBitSubject<T> {
  private _portSubscriptions = new Map<chrome.runtime.Port, Subscription>();
  private _lastId: string;

  constructor(serviceObservableName: string, initializer: (obj: DeepJsonify<T>) => T) {
    super(serviceObservableName, initializer);

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== this.portName) {
        return;
      }

      port.onDisconnect.addListener(this.onDisconnect.bind(this));
      port.onMessage.addListener(this.onMessageFromForeground.bind(this));
      const subscription = this.asObservable().subscribe((value) => {
        this.sendValue(port, value);
      });

      this._portSubscriptions.set(port, subscription);
    });
  }

  override next(value: T): void {
    // Set new message id before nexting the subject
    this._lastId = Utils.newGuid();
    super.next(value);
  }

  private onDisconnect(port: chrome.runtime.Port) {
    this._portSubscriptions.get(port)?.unsubscribe();
    this._portSubscriptions.delete(port);
  }

  private onMessageFromForeground(message: { expectedId: string; data: string }) {
    if (message.expectedId !== this._lastId) {
      // Ignore out of sync messages
      return;
    }

    this.next(this.initializeData(message.data));
  }

  private sendValue(port: chrome.runtime.Port, value: T) {
    port.postMessage({ id: this._lastId, data: JSON.stringify(value) });
  }
}
