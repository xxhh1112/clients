import { BrowserBitSubject } from "./browser-bit-subject";

export class ForegroundBitSubject<T = never> extends BrowserBitSubject<T> {
  private _port: chrome.runtime.Port;
  private _lastId: string;

  constructor(serviceObservableName: string, private initializer: (json: Required<T>) => T) {
    super(serviceObservableName);

    this._port = chrome.runtime.connect({ name: this.portName });
    this._port.onMessage.addListener(this.onMessageFromBackground.bind(this));
  }

  override next(value: T): void {
    // Do not next the subject, background does it first, then tells us to
    this._port.postMessage({ expectedId: this._lastId, data: value });
  }

  private onMessageFromBackground(message: { id: string; data: Required<T> }) {
    this._lastId = message.id;
    super.next(this.initializer(message.data));
  }
}
