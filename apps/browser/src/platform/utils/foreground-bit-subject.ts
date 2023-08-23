import { DeepJsonify } from "@bitwarden/common/types/deep-jsonify";

import { BrowserBitSubject } from "./browser-bit-subject";

export class ForegroundBitSubject<T = never> extends BrowserBitSubject<T> {
  private _port: chrome.runtime.Port;
  private _lastId: string;

  constructor(serviceObservableName: string, initializer: (json: DeepJsonify<T>) => T) {
    super(serviceObservableName, initializer);

    this._port = chrome.runtime.connect({ name: this.portName });
    this._port.onMessage.addListener(this.onMessageFromBackground.bind(this));
  }

  override next(value: T): void {
    // Do not next the subject, background does it first, then tells us to
    this._port.postMessage({ expectedId: this._lastId, data: JSON.stringify(value) });
  }

  private onMessageFromBackground(message: { id: string; data: string }) {
    this._lastId = message.id;
    super.next(this.initializeData(message.data));
  }
}
