import { MutexInterface } from "./mutex.interface";
import { Releaser } from "./releaser";
import { Semaphore } from "./semaphore";
import { Worker } from "./worker";

export class Mutex implements MutexInterface {
  constructor(cancelError?: Error) {
    this._semaphore = new Semaphore(1, cancelError);
  }

  async acquire(): Promise<Releaser> {
    const [, releaser] = await this._semaphore.acquire();

    return releaser;
  }

  runExclusive<T>(callback: Worker<T>): Promise<T> {
    return this._semaphore.runExclusive(() => callback());
  }

  isLocked(): boolean {
    return this._semaphore.isLocked();
  }

  waitForUnlock(): Promise<void> {
    return this._semaphore.waitForUnlock();
  }

  release(): void {
    if (this._semaphore.isLocked()) {
      this._semaphore.release();
    }
  }

  cancel(): void {
    return this._semaphore.cancel();
  }

  private _semaphore: Semaphore;
}
