// eslint-disable-next-line no-restricted-imports
import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { makeStaticByteArray } from "../../../spec/utils";
import { ApiService } from "../../abstractions/api.service";
import { ConfigApiServiceAbstraction } from "../../abstractions/config/config-api.service.abstraction";
import { CryptoService } from "../../abstractions/crypto.service";
import { EncryptService } from "../../abstractions/encrypt.service";
import { I18nService } from "../../abstractions/i18n.service";
import { SearchService } from "../../abstractions/search.service";
import { SettingsService } from "../../abstractions/settings.service";
import { StateService } from "../../abstractions/state.service";
import { EncArrayBuffer } from "../../models/domain/enc-array-buffer";
import { EncString } from "../../models/domain/enc-string";
import { SymmetricCryptoKey } from "../../models/domain/symmetric-crypto-key";
import { ServerConfigResponse } from "../../models/response/server-config.response";
import { ContainerService } from "../../services/container.service";
import { CipherFileUploadService } from "../abstractions/file-upload/cipher-file-upload.service";
import { CipherType } from "../enums/cipher-type";
import { Cipher } from "../models/domain/cipher";
import { CipherView } from "../models/view/cipher.view";

import { CipherService } from "./cipher.service";

const ENCRYPTED_TEXT = "This data has been encrypted";
const ENCRYPTED_BYTES = Substitute.for<EncArrayBuffer>();
const DATE_NOW = new Date();
const UNSUPPORTED_VERSION = "2023.2.0";

describe("Cipher Service", () => {
  let cryptoService: SubstituteOf<CryptoService>;
  let stateService: SubstituteOf<StateService>;
  let settingsService: SubstituteOf<SettingsService>;
  let apiService: SubstituteOf<ApiService>;
  let cipherFileUploadService: SubstituteOf<CipherFileUploadService>;
  let i18nService: SubstituteOf<I18nService>;
  let searchService: SubstituteOf<SearchService>;
  let encryptService: SubstituteOf<EncryptService>;
  let configApiService: SubstituteOf<ConfigApiServiceAbstraction>;

  let cipherService: CipherService;

  beforeEach(() => {
    cryptoService = Substitute.for<CryptoService>();
    stateService = Substitute.for<StateService>();
    settingsService = Substitute.for<SettingsService>();
    apiService = Substitute.for<ApiService>();
    cipherFileUploadService = Substitute.for<CipherFileUploadService>();
    i18nService = Substitute.for<I18nService>();
    searchService = Substitute.for<SearchService>();
    encryptService = Substitute.for<EncryptService>();
    configApiService = Substitute.for<ConfigApiServiceAbstraction>();

    cryptoService.encryptToBytes(Arg.any(), Arg.any()).resolves(ENCRYPTED_BYTES);
    cryptoService.encrypt(Arg.any(), Arg.any()).resolves(new EncString(ENCRYPTED_TEXT));

    (window as any).bitwardenContainerService = new ContainerService(cryptoService, encryptService);

    cipherService = new CipherService(
      cryptoService,
      settingsService,
      apiService,
      i18nService,
      searchService,
      stateService,
      encryptService,
      cipherFileUploadService,
      configApiService
    );
  });

  it("attachments upload encrypted file contents", async () => {
    const fileName = "filename";
    const fileData = new Uint8Array(10).buffer;
    cryptoService.getOrgKey(Arg.any()).resolves(new SymmetricCryptoKey(new Uint8Array(32).buffer));

    configApiService.get().resolves(new ServerConfigResponse({ version: UNSUPPORTED_VERSION }));
    process.env.FLAGS = JSON.stringify({
      enableCipherKeyEncryption: false,
    });

    await cipherService.saveAttachmentRawWithServer(new Cipher(), fileName, fileData);

    cipherFileUploadService
      .received(1)
      .upload(Arg.any(), Arg.any(), ENCRYPTED_BYTES, Arg.any(), Arg.any());
  });

  describe("encrypt", () => {
    let cipherView: CipherView;

    beforeEach(() => {
      cipherView = new CipherView();
      cipherView.type = CipherType.Login;
      cipherView.key = null;

      encryptService.decryptToBytes(Arg.any(), Arg.any()).resolves(makeStaticByteArray(64));
      configApiService.get().resolves(new ServerConfigResponse({ version: getVersion() }));
    });

    describe("cipher.key", () => {
      it("is null when enableCipherKeyEncryption flag is false", async () => {
        process.env.FLAGS = JSON.stringify({
          enableCipherKeyEncryption: false,
        });

        const cipher = await cipherService.encrypt(cipherView);

        expect(cipher.key).toBeUndefined();
      });

      it("is defined when enableCipherKeyEncryption flag is true", async () => {
        process.env.FLAGS = JSON.stringify({
          enableCipherKeyEncryption: true,
        });

        const cipher = await cipherService.encrypt(cipherView);

        expect(cipher.key).toBeDefined();
      });
    });

    describe("encryptWithCipherKey", () => {
      beforeEach(() => {
        jest.spyOn<any, string>(cipherService, "encryptWithCipherKey");
      });

      it("is not called when enableCipherKeyEncryption is false", async () => {
        process.env.FLAGS = JSON.stringify({
          enableCipherKeyEncryption: false,
        });

        await cipherService.encrypt(cipherView);

        expect(cipherService["encryptWithCipherKey"]).not.toHaveBeenCalled();
      });

      it("is called when enableCipherKeyEncryption is true", async () => {
        process.env.FLAGS = JSON.stringify({
          enableCipherKeyEncryption: true,
        });

        await cipherService.encrypt(cipherView);

        expect(cipherService["encryptWithCipherKey"]).toHaveBeenCalled();
      });

      it("is called when server version has hotfix suffix", async () => {
        configApiService = Substitute.for<ConfigApiServiceAbstraction>();

        process.env.FLAGS = JSON.stringify({
          enableCipherKeyEncryption: true,
        });

        configApiService.get().resolves(new ServerConfigResponse({ version: getVersion() }));
        await cipherService.encrypt(cipherView);

        expect(cipherService["encryptWithCipherKey"]).toHaveBeenCalled();
      });
    });
  });

  function getVersion(): string {
    const year = DATE_NOW.getFullYear() + 1;
    return year + "." + DATE_NOW.getMonth() + ".0";
  }
});
