import { EncArrayBuffer } from "@bitwarden/common/models/domain/encArrayBuffer";
import { EncString } from "@bitwarden/common/models/domain/encString";

export type AttachmentFileUpload = {
  admin: boolean;
  cipherId: string;
  encFileName: EncString;
  encData: EncArrayBuffer;
  key: EncString;
};
