export class BitAsyncTag {
  readonly symbol = Symbol();
}

export class BitAsyncTaggedEvent<Event> {
  constructor(readonly value: Event, readonly tag: BitAsyncTag) {}
}
