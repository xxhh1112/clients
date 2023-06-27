import { mock, mockReset } from "jest-mock-extended";

import { CsprngArray } from "../../types/csprng";
import { CryptoFunctionService } from "../abstractions/crypto-function.service";
import { EncryptService } from "../abstractions/encrypt.service";
import { LogService } from "../abstractions/log.service";
import { PlatformUtilsService } from "../abstractions/platform-utils.service";
import { StateService } from "../abstractions/state.service";
import {
  MasterKey,
  PinKey,
  SymmetricCryptoKey,
  UserKey,
} from "../models/domain/symmetric-crypto-key";
import { CryptoService } from "../services/crypto.service";

describe("cryptoService", () => {
  let cryptoService: CryptoService;

  const cryptoFunctionService = mock<CryptoFunctionService>();
  const encryptService = mock<EncryptService>();
  const platformUtilService = mock<PlatformUtilsService>();
  const logService = mock<LogService>();
  const stateService = mock<StateService>();

  beforeEach(() => {
    mockReset(cryptoFunctionService);
    mockReset(encryptService);
    mockReset(platformUtilService);
    mockReset(logService);
    mockReset(stateService);

    cryptoService = new CryptoService(
      cryptoFunctionService,
      encryptService,
      platformUtilService,
      logService,
      stateService
    );
  });

  it("instantiates", () => {
    expect(cryptoService).not.toBeFalsy();
  });

  describe("getKeyForUserDecryption", () => {
    let mockUserKey: UserKey;
    let mockMasterKey: MasterKey;
    let stateSvcGetUserKey: jest.SpyInstance;
    let stateSvcGetMasterKey: jest.SpyInstance;

    beforeEach(() => {
      const mockRandomBytes = new Uint8Array(64).buffer as CsprngArray;
      mockUserKey = new SymmetricCryptoKey(mockRandomBytes) as UserKey;
      mockMasterKey = new SymmetricCryptoKey(new Uint8Array(64).buffer as CsprngArray) as MasterKey;

      stateSvcGetUserKey = jest.spyOn(stateService, "getUserKey");
      stateSvcGetMasterKey = jest.spyOn(stateService, "getMasterKey");
    });

    it("returns the user key if available", async () => {
      stateSvcGetUserKey.mockResolvedValue(mockUserKey);

      const encryptionKey = await cryptoService.getUserKeyWithLegacySupport();

      expect(stateSvcGetUserKey).toHaveBeenCalled();
      expect(stateSvcGetMasterKey).not.toHaveBeenCalled();

      expect(encryptionKey).toEqual(mockUserKey);
    });

    it("returns the user's master key when symmetric key is not available", async () => {
      stateSvcGetUserKey.mockResolvedValue(null);
      stateSvcGetMasterKey.mockResolvedValue(mockMasterKey);

      const encryptionKey = await cryptoService.getUserKeyWithLegacySupport();

      expect(stateSvcGetMasterKey).toHaveBeenCalled();
      expect(encryptionKey).toEqual(mockMasterKey);
    });
  });

  describe("setUserKey", () => {
    const mockUserId = "example user id";
    let mockUserKey: UserKey;

    beforeEach(() => {
      const mockRandomBytes = new Uint8Array(64).buffer as CsprngArray;
      mockUserKey = new SymmetricCryptoKey(mockRandomBytes) as UserKey;
    });

    it("saves an Auto key if needed", async () => {
      stateService.getVaultTimeout.mockResolvedValue(null);

      await cryptoService.setUserKey(mockUserKey, mockUserId);

      expect(stateService.setUserKeyAuto).toHaveBeenCalled();
      expect(stateService.setUserKeyAuto).not.toHaveBeenCalledWith(null, { userId: mockUserId });
    });

    it("saves a Pin key if needed", async () => {
      stateService.getUserKeyPinEphemeral.mockResolvedValue(null);
      const cryptoSvcMakePinKey = jest.spyOn(cryptoService, "makePinKey");
      cryptoSvcMakePinKey.mockResolvedValue(
        new SymmetricCryptoKey(new Uint8Array(64).buffer) as PinKey
      );

      await cryptoService.setUserKey(mockUserKey, mockUserId);

      expect(stateService.setUserKeyPin).toHaveBeenCalled();
    });
  });
});
