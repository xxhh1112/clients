import { Utils } from "@bitwarden/common/platform/misc/utils";

export abstract class WebauthnResponseRequest {
  id: string;
  rawId: string;
  type: string;
  extensions: Record<string, unknown>;

  constructor(credential: PublicKeyCredential) {
    this.id = credential.id;
    this.rawId = Utils.fromBufferToB64(credential.rawId);
    this.type = credential.type;
    this.extensions = {}; // Extensions are handled client-side
  }
}
