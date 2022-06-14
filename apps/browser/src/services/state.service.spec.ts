import { Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

import { LogService } from "jslib-common/abstractions/log.service";
import { AbstractStorageService } from "jslib-common/abstractions/storage.service";
import { StateFactory } from "jslib-common/factories/stateFactory";
import { GlobalState } from "jslib-common/models/domain/globalState";
import { State } from "jslib-common/models/domain/state";
import { StateMigrationService } from "jslib-common/services/stateMigration.service";

import { Account } from "../models/account";
import { BrowserComponentState } from "../models/browserComponentState";
import { BrowserGroupingsComponentState } from "../models/browserGroupingsComponentState";
import { BrowserSendComponentState } from "../models/browserSendComponentState";

import { StateService } from "./state.service";

describe("Browser State Service", () => {
  let secureStorageService: SubstituteOf<AbstractStorageService>;
  let diskStorageService: SubstituteOf<AbstractStorageService>;
  let memoryStorageService: SubstituteOf<AbstractStorageService>;
  let logService: SubstituteOf<LogService>;
  let stateMigrationService: SubstituteOf<StateMigrationService>;
  let stateFactory: SubstituteOf<StateFactory<GlobalState, Account>>;
  let useAccountCache: boolean;

  let state: State<GlobalState, Account>;
  const userId = "userId";

  let sut: StateService;

  beforeEach(() => {
    secureStorageService = Substitute.for();
    diskStorageService = Substitute.for();
    memoryStorageService = Substitute.for();
    logService = Substitute.for();
    stateMigrationService = Substitute.for();
    stateFactory = Substitute.for();
    useAccountCache = true;

    state = new State(new GlobalState());
    state.accounts[userId] = new Account({
      profile: { userId: userId },
    });
    state.activeUserId = userId;
    memoryStorageService.get("state").resolves(JSON.parse(JSON.stringify(state)));

    sut = new StateService(
      diskStorageService,
      secureStorageService,
      memoryStorageService,
      logService,
      stateMigrationService,
      stateFactory,
      useAccountCache
    );
  });

  describe("getBrowserGroupingComponentState", () => {
    it("should return a BrowserGroupingsComponentState", async () => {
      state.accounts["userId"].groupings = new BrowserGroupingsComponentState();

      const actual = await sut.getBrowserGroupingComponentState();
      expect(actual).toBeInstanceOf(BrowserGroupingsComponentState);
    });
  });

  describe("getBrowserCipherComponentState", () => {
    it("should return a BrowserComponentState", async () => {
      state.accounts["userId"].ciphers = new BrowserComponentState();

      const actual = await sut.getBrowserCipherComponentState();
      expect(actual).toBeInstanceOf(BrowserComponentState);
    });
  });

  describe("getBrowserSendComponentState", () => {
    it("should return a BrowserSendComponentState", async () => {
      state.accounts["userId"].send = new BrowserSendComponentState();

      const actual = await sut.getBrowserSendComponentState();
      expect(actual).toBeInstanceOf(BrowserSendComponentState);
    });
  });

  describe("getBrowserSendTypeComponentState", () => {
    it("should return a BrowserComponentState", async () => {
      state.accounts["userId"].sendType = new BrowserComponentState();

      const actual = await sut.getBrowserSendTypeComponentState();
      expect(actual).toBeInstanceOf(BrowserComponentState);
    });
  });
});
