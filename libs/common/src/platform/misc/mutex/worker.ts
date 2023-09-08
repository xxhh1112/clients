export interface Worker<T> {
  (): Promise<T> | T;
}

export interface SemaphoreWorker<T> {
  (value: number): Promise<T> | T;
}
