import { Releaser } from "./releaser";
import { Worker } from "./worker";

export interface MutexInterface {
  acquire(): Promise<Releaser>;

  runExclusive<T>(callback: Worker<T>): Promise<T>;

  waitForUnlock(): Promise<void>;

  isLocked(): boolean;

  release(): void;

  cancel(): void;
}
