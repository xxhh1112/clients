import { mock, MockProxy } from "jest-mock-extended";

import { makeStaticByteArray, mockEnc, mockFromJson } from "../../../spec/utils";
import { EncryptService } from "../../abstractions/encrypt.service";
import { Attachment } from "../domain/attachment";
import { EncString } from "../domain/enc-string";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

import { AttachmentView } from "./attachment.view";

jest.mock("../domain/symmetric-crypto-key");

describe("AttachmentView", () => {
  describe("fileSize", () => {
    it("null", () => {
      const view = new AttachmentView();
      view.size = null;

      expect(view.fileSize).toEqual(0);
    });

    it("invalid number", () => {
      const view = new AttachmentView();
      view.size = "invalid";

      expect(view.fileSize).toEqual(NaN);
    });

    it("valid", () => {
      const view = new AttachmentView();
      view.size = "100";

      expect(view.fileSize).toEqual(100);
    });
  });

  it("fromJSON initializes nested objects", () => {
    jest.spyOn(SymmetricCryptoKey, "fromJSON").mockImplementation(mockFromJson);

    const actual = AttachmentView.fromJSON({
      key: "encKeyB64" as any,
    });

    expect(actual.key).toEqual("encKeyB64_fromJSON");
  });

  describe("encrypt", () => {
    let encryptService: MockProxy<EncryptService>;

    beforeEach(() => {
      encryptService = mock<EncryptService>();
    });

    it("empty", async () => {
      const view = new AttachmentView();

      const attachment = await view.encrypt(encryptService, null);

      expect(attachment).toEqual({
        id: null,
        url: null,
        size: null,
        sizeName: null,
        key: null,
        fileName: null,
      });
    });

    it("valid data", async () => {
      const view = new AttachmentView();
      view.id = "id";
      view.url = "url";
      view.size = "1100";
      view.sizeName = "1.1 KB";
      view.key = new SymmetricCryptoKey(makeStaticByteArray(32));
      view.fileName = "fileName";

      encryptService.encrypt.mockResolvedValueOnce(new EncString("encFileName"));
      encryptService.encrypt.mockResolvedValueOnce(new EncString("encKey"));

      const attachment = await view.encrypt(encryptService, null);

      expect(attachment).toEqual({
        id: "id",
        url: "url",
        size: "1100",
        sizeName: "1.1 KB",
        fileName: { encryptedString: "encFileName", encryptionType: 0 },
        key: { encryptedString: "encKey", encryptionType: 0 },
      });
    });
  });

  describe("decrypt", () => {
    let encryptService: MockProxy<EncryptService>;

    beforeEach(() => {
      encryptService = mock<EncryptService>();
    });

    it("empty", async () => {
      const attachment = new Attachment();

      const view = await AttachmentView.decrypt(encryptService, null, attachment);

      expect(view).toEqual({
        id: undefined,
        url: undefined,
        size: undefined,
        sizeName: undefined,
        fileName: undefined,
        key: expect.any(SymmetricCryptoKey),
      });
    });

    it("valid data", async () => {
      const attachment = new Attachment();
      attachment.id = "id";
      attachment.url = "url";
      attachment.size = "1100";
      attachment.sizeName = "1.1 KB";
      attachment.key = mockEnc("key");
      attachment.fileName = mockEnc("fileName");

      encryptService.decryptToBytes.mockResolvedValue(makeStaticByteArray(32));

      const view = await AttachmentView.decrypt(encryptService, null, attachment);

      expect(view).toEqual({
        id: "id",
        url: "url",
        size: "1100",
        sizeName: "1.1 KB",
        fileName: "fileName",
        key: expect.any(SymmetricCryptoKey),
      });
    });
  });
});
