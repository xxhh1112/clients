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
  UserSymKey,
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
    let mockUserSymKey: UserSymKey;
    let mockMasterKey: MasterKey;
    let stateSvcGetUserSymKey: jest.SpyInstance;
    let stateSvcGetMasterKey: jest.SpyInstance;

    beforeEach(() => {
      const mockRandomBytes = new Uint8Array(64).buffer as CsprngArray;
      mockUserSymKey = new SymmetricCryptoKey(mockRandomBytes) as UserSymKey;
      mockMasterKey = new SymmetricCryptoKey(new Uint8Array(64).buffer as CsprngArray) as MasterKey;

      stateSvcGetUserSymKey = jest.spyOn(stateService, "getUserSymKey");
      stateSvcGetMasterKey = jest.spyOn(stateService, "getMasterKey");
    });

    it("returns the user's symmetric key if available", async () => {
      stateSvcGetUserSymKey.mockResolvedValue(mockUserSymKey);

      const encryptionKey = await cryptoService.getKeyForUserEncryption();

      expect(stateSvcGetUserSymKey).toHaveBeenCalled();
      expect(stateSvcGetMasterKey).not.toHaveBeenCalled();

      expect(encryptionKey).toEqual(mockUserSymKey);
    });

    it("returns the user's master key when symmetric key is not available", async () => {
      stateSvcGetUserSymKey.mockResolvedValue(null);
      stateSvcGetMasterKey.mockResolvedValue(mockMasterKey);

      const encryptionKey = await cryptoService.getKeyForUserEncryption();

      expect(stateSvcGetMasterKey).toHaveBeenCalled();
      expect(encryptionKey).toEqual(mockMasterKey);
    });
  });

  describe("setUserKey", () => {
    const mockUserId = "example user id";
    let mockUserSymKey: UserSymKey;

    beforeEach(() => {
      const mockRandomBytes = new Uint8Array(64).buffer as CsprngArray;
      mockUserSymKey = new SymmetricCryptoKey(mockRandomBytes) as UserSymKey;
    });

    it("saves an Auto key if needed", async () => {
      stateService.getVaultTimeout.mockResolvedValue(null);

      await cryptoService.setUserKey(mockUserSymKey, mockUserId);

      expect(stateService.setUserSymKeyAuto).toHaveBeenCalled();
      expect(stateService.setUserSymKeyAuto).not.toHaveBeenCalledWith(null, { userId: mockUserId });
    });

    it("saves a Pin key if needed", async () => {
      stateService.getUserSymKeyPinEphemeral.mockResolvedValue(null);
      const cryptoSvcMakePinKey = jest.spyOn(cryptoService, "makePinKey");
      cryptoSvcMakePinKey.mockResolvedValue(
        new SymmetricCryptoKey(new Uint8Array(64).buffer) as PinKey
      );

      await cryptoService.setUserKey(mockUserSymKey, mockUserId);

      expect(stateService.setUserSymKeyPin).toHaveBeenCalled();
    });
  });
});
