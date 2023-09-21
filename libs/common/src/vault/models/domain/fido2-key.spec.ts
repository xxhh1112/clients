import { mockEnc } from "../../../../spec";
import { EncryptionType } from "../../../enums";
import { EncString } from "../../../platform/models/domain/enc-string";
import { Fido2KeyData } from "../data/fido2-key.data";

import { Fido2Key } from "./fido2-key";

describe("Fido2Key", () => {
  let mockDate: Date;

  beforeEach(() => {
    mockDate = new Date("2023-01-01T12:00:00.000Z");
  });

  describe("constructor", () => {
    it("returns all fields null when given empty data parameter", () => {
      const data = new Fido2KeyData();
      const fido2Key = new Fido2Key(data);

      expect(fido2Key).toEqual({
        credentialId: null,
        keyType: null,
        keyAlgorithm: null,
        keyCurve: null,
        keyValue: null,
        rpId: null,
        userHandle: null,
        rpName: null,
        userDisplayName: null,
        counter: null,
        discoverable: null,
        creationDate: null,
      });
    });

    it("returns all fields as EncStrings except creationDate when given full Fido2KeyData", () => {
      const data: Fido2KeyData = {
        credentialId: "credentialId",
        keyType: "public-key",
        keyAlgorithm: "ECDSA",
        keyCurve: "P-256",
        keyValue: "keyValue",
        rpId: "rpId",
        userHandle: "userHandle",
        counter: "counter",
        rpName: "rpName",
        userDisplayName: "userDisplayName",
        discoverable: "discoverable",
        creationDate: mockDate.toISOString(),
      };
      const fido2Key = new Fido2Key(data);

      expect(fido2Key).toEqual({
        credentialId: { encryptedString: "credentialId", encryptionType: 0 },
        keyType: { encryptedString: "public-key", encryptionType: 0 },
        keyAlgorithm: { encryptedString: "ECDSA", encryptionType: 0 },
        keyCurve: { encryptedString: "P-256", encryptionType: 0 },
        keyValue: { encryptedString: "keyValue", encryptionType: 0 },
        rpId: { encryptedString: "rpId", encryptionType: 0 },
        userHandle: { encryptedString: "userHandle", encryptionType: 0 },
        counter: { encryptedString: "counter", encryptionType: 0 },
        rpName: { encryptedString: "rpName", encryptionType: 0 },
        userDisplayName: { encryptedString: "userDisplayName", encryptionType: 0 },
        discoverable: { encryptedString: "discoverable", encryptionType: 0 },
        creationDate: mockDate,
      });
    });

    it("should not populate fields when data parameter is not given", () => {
      const fido2Key = new Fido2Key();

      expect(fido2Key).toEqual({
        credentialId: null,
      });
    });
  });

  describe("decrypt", () => {
    it("decrypts and populates all fields when populated with EncStrings", async () => {
      const fido2Key = new Fido2Key();
      fido2Key.credentialId = mockEnc("credentialId");
      fido2Key.keyType = mockEnc("keyType");
      fido2Key.keyAlgorithm = mockEnc("keyAlgorithm");
      fido2Key.keyCurve = mockEnc("keyCurve");
      fido2Key.keyValue = mockEnc("keyValue");
      fido2Key.rpId = mockEnc("rpId");
      fido2Key.userHandle = mockEnc("userHandle");
      fido2Key.counter = mockEnc("2");
      fido2Key.rpName = mockEnc("rpName");
      fido2Key.userDisplayName = mockEnc("userDisplayName");
      fido2Key.discoverable = mockEnc("true");
      fido2Key.creationDate = mockDate;

      const fido2KeyView = await fido2Key.decrypt(null);

      expect(fido2KeyView).toEqual({
        credentialId: "credentialId",
        keyType: "keyType",
        keyAlgorithm: "keyAlgorithm",
        keyCurve: "keyCurve",
        keyValue: "keyValue",
        rpId: "rpId",
        userHandle: "userHandle",
        rpName: "rpName",
        userDisplayName: "userDisplayName",
        counter: 2,
        discoverable: true,
        creationDate: mockDate,
      });
    });
  });

  describe("toFido2KeyData", () => {
    it("encodes to data object when converted from Fido2KeyData and back", () => {
      const data: Fido2KeyData = {
        credentialId: "credentialId",
        keyType: "public-key",
        keyAlgorithm: "ECDSA",
        keyCurve: "P-256",
        keyValue: "keyValue",
        rpId: "rpId",
        userHandle: "userHandle",
        counter: "2",
        rpName: "rpName",
        userDisplayName: "userDisplayName",
        discoverable: "true",
        creationDate: mockDate.toISOString(),
      };

      const fido2Key = new Fido2Key(data);
      const result = fido2Key.toFido2KeyData();

      expect(result).toEqual(data);
    });
  });

  describe("fromJSON", () => {
    it("recreates equivalent object when converted to JSON and back", () => {
      const fido2Key = new Fido2Key();
      fido2Key.credentialId = createEncryptedEncString("credentialId");
      fido2Key.keyType = createEncryptedEncString("keyType");
      fido2Key.keyAlgorithm = createEncryptedEncString("keyAlgorithm");
      fido2Key.keyCurve = createEncryptedEncString("keyCurve");
      fido2Key.keyValue = createEncryptedEncString("keyValue");
      fido2Key.rpId = createEncryptedEncString("rpId");
      fido2Key.userHandle = createEncryptedEncString("userHandle");
      fido2Key.counter = createEncryptedEncString("2");
      fido2Key.rpName = createEncryptedEncString("rpName");
      fido2Key.userDisplayName = createEncryptedEncString("userDisplayName");
      fido2Key.discoverable = createEncryptedEncString("discoverable");
      fido2Key.creationDate = mockDate;

      const json = JSON.stringify(fido2Key);
      const result = Fido2Key.fromJSON(JSON.parse(json));

      expect(result).toEqual(fido2Key);
    });

    it("returns null if input is null", () => {
      expect(Fido2Key.fromJSON(null)).toBeNull();
    });
  });
});

function createEncryptedEncString(s: string): EncString {
  return new EncString(`${EncryptionType.AesCbc256_HmacSha256_B64}.${s}`);
}
