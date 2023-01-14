import { mock, MockProxy } from "jest-mock-extended";

import { makeStaticByteArray, mockEnc, mockFromJson } from "../../../spec/utils";
import { CryptoService } from "../../abstractions/crypto.service";
import { EncryptService } from "../../abstractions/encrypt.service";
import { ContainerService } from "../../services/container.service";
import { Attachment } from "../domain/attachment";
import { SymmetricCryptoKey } from "../domain/symmetric-crypto-key";

import { AttachmentView } from "./attachment.view";

jest.mock("../domain/symmetric-crypto-key");

describe("AttachmentView", () => {
  it("fromJSON initializes nested objects", () => {
    jest.spyOn(SymmetricCryptoKey, "fromJSON").mockImplementation(mockFromJson);

    const actual = AttachmentView.fromJSON({
      key: "encKeyB64" as any,
    });

    expect(actual.key).toEqual("encKeyB64_fromJSON");
  });

  describe("decrypt", () => {
    let cryptoService: MockProxy<CryptoService>;
    let encryptService: MockProxy<EncryptService>;

    beforeEach(() => {
      cryptoService = mock<CryptoService>();
      encryptService = mock<EncryptService>();

      (window as any).bitwardenContainerService = new ContainerService(
        cryptoService,
        encryptService
      );
    });

    it("expected output", async () => {
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
