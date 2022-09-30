import { mock, mockReset } from "jest-mock-extended";
import { Subject } from "rxjs";

import { AbstractEncryptService } from "@bitwarden/common/abstractions/abstractEncrypt.service";
import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { SyncNotifierService } from "@bitwarden/common/abstractions/sync/syncNotifier.service.abstraction";
import { VaultTimeoutSettingsService } from "@bitwarden/common/abstractions/vaultTimeout/vaultTimeoutSettings.service";
import { ProfileOrganizationResponse } from "@bitwarden/common/models/response/profileOrganizationResponse";
import { ProfileProviderOrganizationResponse } from "@bitwarden/common/models/response/profileProviderOrganizationResponse";
import { ProfileProviderResponse } from "@bitwarden/common/models/response/profileProviderResponse";
import { CryptoService } from "@bitwarden/common/services/crypto.service";
import { SyncSuccessfullyCompletedEventArgs } from "@bitwarden/common/types/syncEventArgs";

import { awaitConcatMap } from "../utils";

describe("cryptoService", () => {
  const cryptoFunctionService = mock<CryptoFunctionService>();
  const encryptService = mock<AbstractEncryptService>();
  const platformUtilService = mock<PlatformUtilsService>();
  const logService = mock<LogService>();
  const stateService = mock<StateService>();
  const vaultTimeoutSettingsService = mock<VaultTimeoutSettingsService>();
  const syncNotifierService = mock<SyncNotifierService>();

  let dummySubject: Subject<void>;

  let _sut: CryptoService;
  const sut = () => {
    return (
      _sut ??
      new CryptoService(
        cryptoFunctionService,
        encryptService,
        platformUtilService,
        logService,
        stateService,
        vaultTimeoutSettingsService,
        syncNotifierService
      )
    );
  };

  beforeEach(() => {
    dummySubject = new Subject<void>();

    mockReset(cryptoFunctionService);
    mockReset(encryptService);
    mockReset(platformUtilService);
    mockReset(logService);
    mockReset(stateService);
    mockReset(vaultTimeoutSettingsService);
    mockReset(syncNotifierService);
  });

  afterEach(() => {
    dummySubject.complete();
  });

  it("instantiates", () => {
    stateService.activeAccountUnlocked$ = dummySubject.asObservable() as any;
    syncNotifierService.syncCompletedSuccessfully$ = dummySubject.asObservable() as any;

    expect(sut()).not.toBeFalsy();
  });

  describe("listens to syncs", () => {
    const eventArgs: SyncSuccessfullyCompletedEventArgs = {
      status: "Completed",
      successfully: true,
      data: {
        profile: {
          key: "value",
          privateKey: "privateKey",
          organizations: mock<ProfileOrganizationResponse[]>(),
          providerOrganizations: mock<ProfileProviderOrganizationResponse[]>(),
          providers: mock<ProfileProviderResponse[]>(),
        } as any, // min type, not proper type
      } as any, // min type, not proper type
    };

    let syncSubject: Subject<SyncSuccessfullyCompletedEventArgs>;
    beforeEach(() => {
      syncSubject = new Subject<SyncSuccessfullyCompletedEventArgs>();
      syncNotifierService.syncCompletedSuccessfully$ = syncSubject.asObservable();
      stateService.activeAccountUnlocked$ = dummySubject.asObservable() as any;
    });

    afterEach(() => {
      syncSubject.complete();
    });

    it("should set the enc key", async () => {
      const setEncKeySpy = jest.spyOn(sut(), "setEncKey").mockImplementation();

      syncSubject.next(eventArgs);
      await awaitConcatMap();

      expect(setEncKeySpy).toHaveBeenCalledWith(eventArgs.data.profile.key);
    });

    it("should set the private key", async () => {
      const setPrivateKeySpy = jest.spyOn(sut(), "setEncPrivateKey").mockImplementation();

      syncSubject.next(eventArgs);
      await awaitConcatMap();

      expect(setPrivateKeySpy).toHaveBeenCalledWith(eventArgs.data.profile.privateKey);
    });

    it("should set the org keys", async () => {
      const setOrgKeysSpy = jest.spyOn(sut(), "setOrgKeys").mockImplementation();

      syncSubject.next(eventArgs);
      await awaitConcatMap();

      expect(setOrgKeysSpy).toHaveBeenCalledWith(
        eventArgs.data.profile.organizations,
        eventArgs.data.profile.providerOrganizations
      );
    });

    it("should set the provider org keys", async () => {
      const setProviderKeysSpy = jest.spyOn(sut(), "setProviderKeys").mockImplementation();

      syncSubject.next(eventArgs);
      await awaitConcatMap();

      expect(setProviderKeysSpy).toHaveBeenCalledWith(eventArgs.data.profile.providers);
    });
  });
});
