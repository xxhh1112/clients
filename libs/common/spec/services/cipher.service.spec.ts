import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { SearchService } from "@bitwarden/common/abstractions/search.service";
import { SettingsService } from "@bitwarden/common/abstractions/settings.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { CipherRepromptType } from "@bitwarden/common/enums/cipherRepromptType";
import { CipherType } from "@bitwarden/common/enums/cipherType";
import { Utils } from "@bitwarden/common/misc/utils";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { EncArrayBuffer } from "@bitwarden/common/models/domain/encArrayBuffer";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { Identity } from "@bitwarden/common/models/domain/identity";
import { CipherView } from "@bitwarden/common/models/view/cipherView";
import { IdentityView } from "@bitwarden/common/models/view/identityView";
import { CipherService } from "@bitwarden/common/services/cipher.service";

import { mockEnc } from "../utils";

const ENCRYPTED_TEXT = "This data has been encrypted";
const ENCRYPTED_BYTES = Substitute.for<EncArrayBuffer>();

describe("Cipher Service", () => {
  let cryptoService: SubstituteOf<CryptoService>;
  let stateService: SubstituteOf<StateService>;
  let settingsService: SubstituteOf<SettingsService>;
  let apiService: SubstituteOf<ApiService>;
  let i18nService: SubstituteOf<I18nService>;
  let searchService: SubstituteOf<SearchService>;
  let logService: SubstituteOf<LogService>;

  let cipherService: CipherService;

  beforeEach(() => {
    cryptoService = Substitute.for<CryptoService>();
    stateService = Substitute.for<StateService>();
    settingsService = Substitute.for<SettingsService>();
    apiService = Substitute.for<ApiService>();
    i18nService = Substitute.for<I18nService>();
    searchService = Substitute.for<SearchService>();
    logService = Substitute.for<LogService>();

    cryptoService.encryptToBytes(Arg.any(), Arg.any()).resolves(ENCRYPTED_BYTES);
    cryptoService.encrypt(Arg.any(), Arg.any()).resolves(new EncString(ENCRYPTED_TEXT));

    cipherService = new CipherService(
      cryptoService,
      settingsService,
      apiService,
      i18nService,
      () => searchService,
      logService,
      stateService
    );
  });

  describe("encrypt", () => {
    it("encrypt", async () => {
      const model = new CipherView();
      model.id = "2";
      model.name = "Test Cipher";
      model.organizationId = Utils.newGuid();
      model.type = CipherType.SecureNote;
      model.collectionIds = [Utils.newGuid()];
      model.revisionDate = null;

      // let originalCipher: Cipher = new Cipher()
      const cipher = new Cipher();
      cipher.id = "2";
      cipher.organizationId = "orgId";
      cipher.folderId = "folderId";
      cipher.edit = true;
      cipher.viewPassword = true;
      cipher.organizationUseTotp = true;
      cipher.favorite = false;
      cipher.revisionDate = new Date("2022-01-31T12:00:00.000Z");
      cipher.type = CipherType.Identity;
      cipher.name = mockEnc("EncryptedString");
      cipher.notes = mockEnc("EncryptedString");
      cipher.deletedDate = null;
      cipher.reprompt = CipherRepromptType.None;

      const identityView = new IdentityView();
      identityView.firstName = "firstName";
      identityView.lastName = "lastName";

      const identity = Substitute.for<Identity>();
      identity.decrypt(Arg.any(), Arg.any()).resolves(identityView);
      cipher.identity = identity;

      cryptoService.encrypt(Arg.any()).resolves(new EncString("ENC"));
      cryptoService.decryptToUtf8(Arg.any()).resolves("DEC");

      const result = await cipherService.encrypt(model, null, cipher);

      expect(result.id).toEqual("2");
      expect(result.collectionIds).toEqual(model.collectionIds);
      expect(result.organizationId).toEqual(model.organizationId);
    });
  });
});
