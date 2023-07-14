import { AsyncContextService } from "./async-context.service";
import { BitAsyncTag } from "./bit-async-tag";

export class BitAsyncEvent<E = unknown> {
  constructor(
    readonly value: E,
    readonly tag: BitAsyncTag,
    readonly originalContext?: AsyncContextService
  ) {}
}
