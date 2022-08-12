import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { FileUploadService } from "@bitwarden/common/abstractions/fileUpload.service";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { EncArrayBuffer } from "@bitwarden/common/models/domain/encArrayBuffer";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { CipherApiAttachmentService } from "@bitwarden/common/services/cipher/cipher-api-attachement.service";

const ENCRYPTED_TEXT = "This data has been encrypted";
const ENCRYPTED_BYTES = Substitute.for<EncArrayBuffer>();

describe("Cipher Service", () => {
  let cryptoService: SubstituteOf<CryptoService>;
  let cipherApiAttachmentService: SubstituteOf<CipherApiAttachmentService>;
  let fileUploadService: SubstituteOf<FileUploadService>;

  beforeEach(() => {
    cryptoService = Substitute.for<CryptoService>();
    fileUploadService = Substitute.for<FileUploadService>();

    cryptoService.encryptToBytes(Arg.any(), Arg.any()).resolves(ENCRYPTED_BYTES);
    cryptoService.encrypt(Arg.any(), Arg.any()).resolves(new EncString(ENCRYPTED_TEXT));
  });

  it("attachments upload encrypted file contents", async () => {
    const fileName = "filename";
    const fileData = new Uint8Array(10).buffer;
    cryptoService.getOrgKey(Arg.any()).resolves(new SymmetricCryptoKey(new Uint8Array(32).buffer));

    await cipherApiAttachmentService.saveAttachmentRawWithServer(new Cipher(), fileName, fileData);

    fileUploadService
      .received(1)
      .uploadCipherAttachment(Arg.any(), Arg.any(), new EncString(ENCRYPTED_TEXT), ENCRYPTED_BYTES);
  });
});
