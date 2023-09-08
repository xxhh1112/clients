import { Releaser } from "./releaser";
import { Worker } from "./worker";

export interface SemaphoreInterface {
  acquire(weight?: number): Promise<[number, Releaser]>;

  runExclusive<T>(callback: Worker<T>, weight?: number): Promise<T>;

  waitForUnlock(weight?: number): Promise<void>;

  isLocked(): boolean;

  getValue(): number;

  setValue(value: number): void;

  release(weight?: number): void;

  cancel(): void;
}
