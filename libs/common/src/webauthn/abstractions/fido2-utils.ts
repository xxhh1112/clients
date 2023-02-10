import { Utils } from "../../misc/utils";

export class Fido2Utils {
  static bufferToString(bufferSource: BufferSource): string {
    const buffer = Fido2Utils.bufferSourceToUint8Array(bufferSource);

    return Utils.fromBufferToUrlB64(buffer);
  }

  static stringToBuffer(str: string): Uint8Array {
    return Utils.fromUrlB64ToArray(str);
  }

  private static bufferSourceToUint8Array(bufferSource: BufferSource) {
    if (bufferSource instanceof ArrayBuffer) {
      return new Uint8Array(bufferSource);
    } else {
      return new Uint8Array(bufferSource.buffer);
    }
  }
}
