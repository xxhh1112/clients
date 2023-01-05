import { mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject } from "rxjs";

import { awaitAsync } from "../../../test-utils";
import { AccountService } from "../../abstractions/account/account.service";
import { CipherService } from "../../abstractions/cipher.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { PlatformUtilsService } from "../../abstractions/platformUtils.service";
import { SubjectData } from "../../misc/subject-data";
import { AuthService } from "../auth.service";
import { CollectionService } from "../collection.service";
import { CryptoService } from "../crypto.service";
import { FolderService } from "../folder/folder.service";
import { KeyConnectorService } from "../keyConnector.service";
import { SearchService } from "../search.service";
import { StateService } from "../state.service";

import { VaultTimeoutService } from "./vaultTimeout.service";
import { VaultTimeoutSettingsService } from "./vaultTimeoutSettings.service";

describe("VaultTimeoutService", () => {
  let sut: VaultTimeoutService;
  let cipherService: MockProxy<CipherService>;
  let folderService: MockProxy<FolderService>;
  let collectionService: MockProxy<CollectionService>;
  let cryptoService: MockProxy<CryptoService>;
  let platformUtilsService: MockProxy<PlatformUtilsService>;
  let messagingService: MockProxy<MessagingService>;
  let searchService: MockProxy<SearchService>;
  let keyConnectorService: MockProxy<KeyConnectorService>;
  let stateService: MockProxy<StateService>;
  let authService: MockProxy<AuthService>;
  let vaultTimeoutSettingsService: MockProxy<VaultTimeoutSettingsService>;
  let accountService: MockProxy<AccountService>;
  const lockedCallback: (userId?: string) => Promise<void> = jest.fn();
  const loggedOutCallback: (expired: boolean, userId?: string) => Promise<void> = jest.fn();

  beforeEach(() => {
    cipherService = mock();
    folderService = mock();
    collectionService = mock();
    cryptoService = mock();
    platformUtilsService = mock();
    messagingService = mock();
    searchService = mock();
    keyConnectorService = mock();
    stateService = mock();
    authService = mock();
    vaultTimeoutSettingsService = mock();
    accountService = mock();

    sut = new VaultTimeoutService(
      cipherService,
      folderService,
      collectionService,
      cryptoService,
      platformUtilsService,
      messagingService,
      searchService,
      keyConnectorService,
      stateService,
      authService,
      vaultTimeoutSettingsService,
      accountService,
      lockedCallback,
      loggedOutCallback
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkVaultTimeout", () => {
    const data = SubjectData.loading([
      SubjectData.loading({ id: "1" }),
      SubjectData.loaded({ id: "2" }),
    ]);
    let accounts: BehaviorSubject<SubjectData<any>>;

    beforeEach(() => {
      accounts = new BehaviorSubject(data);
      accountService.accounts$ = accounts.asObservable();
    });

    afterEach(() => {
      accounts.complete();
    });

    it("should only finish once accounts is loaded", async () => {
      let finished = false;

      await Promise.race([
        async () => {
          await sut.checkVaultTimeout();
          finished = true;
        },
        awaitAsync(100),
      ]);

      expect(finished).toBe(false);
    });

    it("should call should lock for each user", async () => {
      accounts.next(data.update(data.data, true));
      const spy = jest.spyOn(sut as any, "shouldLock").mockResolvedValue(false);

      await sut.checkVaultTimeout();

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("should execute timeout action", async () => {
      accounts.next(data.update(data.data, true));
      jest
        .spyOn(sut as any, "shouldLock")
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      const spy = jest.spyOn(sut as any, "executeTimeoutAction").mockImplementation();

      await sut.checkVaultTimeout();

      expect(spy).toHaveBeenCalledWith("2");
    });
  });
});
