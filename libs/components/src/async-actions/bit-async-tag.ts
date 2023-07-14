import { Opaque } from "type-fest";

export type BitAsyncTag = Opaque<symbol, "BitAsyncTag">;

export class BitAsyncTaggedEvent<Event> {
  readonly tag = BitAsyncTag();
  constructor(readonly event: Event) {}
}

export function BitAsyncTag(): BitAsyncTag {
  return Symbol() as BitAsyncTag;
}
