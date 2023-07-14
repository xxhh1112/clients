export class BitAsyncTag {
  readonly symbol = Symbol();
}

export class BitAsyncTaggedEvent<E = unknown> {
  constructor(readonly value: E, readonly tag: BitAsyncTag) {}
}
