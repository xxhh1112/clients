import { Converters } from "./converters";

export class InvalidCredentialIdEncodingError extends Error {
  constructor(readonly input: unknown) {
    super("Could not create instance of credentialId: Input has unknown encoding");
  }
}

export class CredentialId {
  readonly raw: Uint8Array;
  readonly encoded: string;

  constructor(rawOrEncoded: BufferSource | Uint8Array | string) {
    if (rawOrEncoded instanceof Uint8Array) {
      this.raw = rawOrEncoded;
      this.encoded = CredentialId.encode(this.raw);
    } else if (typeof rawOrEncoded === "string") {
      this.encoded = rawOrEncoded;
      this.raw = CredentialId.decode(this.encoded);
    } else if (rawOrEncoded instanceof window.ArrayBuffer) {
      this.raw = new Uint8Array(rawOrEncoded);
      this.encoded = CredentialId.encode(this.raw);
    } else if (rawOrEncoded.buffer) {
      this.raw = new Uint8Array(rawOrEncoded.buffer);
      this.encoded = CredentialId.encode(this.raw);
    } else {
      throw new InvalidCredentialIdEncodingError(rawOrEncoded);
    }
  }

  equals(other: CredentialId) {
    return this.encoded === other.encoded;
  }

  private static encode(raw: Uint8Array): string {
    return Converters.base64ToBase64URL(Converters.Uint8ArrayToBase64(raw));
  }

  private static decode(encoded: string): Uint8Array {
    return Converters.base64ToUint8Array(Converters.base64URLToBase64(encoded));
  }
}
