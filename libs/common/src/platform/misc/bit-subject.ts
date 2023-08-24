import { ReplaySubject, firstValueFrom } from "rxjs";

export class BitSubject<T = never> {
  private _subject = new ReplaySubject<T>(1);
  private _value: T;
  protected _initialized = false;

  next(value: T): void {
    this._initialized = true;

    this._value = value;
    this._subject.next(value);
  }

  get value(): T {
    if (!this._initialized) {
      throw new Error("Cannot call getValue on an uninitialized BitSubject");
    }

    return this._value;
  }

  asObservable() {
    return this._subject.asObservable();
  }

  static initWith<T>(value: T) {
    const subject = new BitSubject<T>();
    subject.next(value);
    return subject;
  }

  letInitialize(waitInMs = 100) {
    return Promise.race([
      firstValueFrom(this.asObservable()).then((v) => true),

      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), waitInMs);
      }),
    ]);
  }
}
