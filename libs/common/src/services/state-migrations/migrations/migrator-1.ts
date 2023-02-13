import { KdfType } from "../../../enums/kdfType";
import { StateVersion } from "../../../enums/stateVersion";
import { ThemeType } from "../../../enums/themeType";
import { CollectionData } from "../../../models/data/collection.data";
import { EventData } from "../../../models/data/event.data";
import { OrganizationData } from "../../../models/data/organization.data";
import { PolicyData } from "../../../models/data/policy.data";
import { ProviderData } from "../../../models/data/provider.data";
import { SendData } from "../../../models/data/send.data";
import {
  AccountSettings,
  EncryptionPair,
  AccountSettingsSettings,
} from "../../../models/domain/account";
import { EncString } from "../../../models/domain/enc-string";
import { EnvironmentUrls } from "../../../models/domain/environment-urls";
import { GeneratedPasswordHistory } from "../../../models/domain/generated-password-history";
import { GlobalState } from "../../../models/domain/global-state";
import { CipherData } from "../../../vault/models/data/cipher.data";
import { FolderData } from "../../../vault/models/data/folder.data";
import { keys } from "../../stateMigration.service";
import { MigrationHelper } from "../migration-helper";
import { VersionMigrator } from "../migrator";

export class Migrator1 extends VersionMigrator<1, 2> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const clearV1Keys = async (clearingUserId?: string) => {
      for (const key in v1Keys) {
        if (key == null) {
          continue;
        }
        await helper.set(v1Keys[key], null);
      }
      if (clearingUserId != null) {
        for (const keyPrefix in v1KeyPrefixes) {
          if (keyPrefix == null) {
            continue;
          }
          await helper.set(v1KeyPrefixes[keyPrefix] + userId, null);
        }
      }
    };

    // Some processes, like biometrics, may have already defined a value before migrations are run.
    // We don't want to null out those values if they don't exist in the old storage scheme (like for new installs)
    // So, the OOO for migration is that we:
    // 1. Check for an existing storage value from the old storage structure OR
    // 2. Check for a value already set by processes that run before migration OR
    // 3. Assign the default value
    const globals =
      (await helper.get<GlobalState>(keys.global)) ?? this.stateFactory.createGlobal(null);
    globals.stateVersion = StateVersion.Two;
    globals.environmentUrls =
      (await helper.get<EnvironmentUrls>(v1Keys.environmentUrls)) ?? globals.environmentUrls;
    globals.locale = (await helper.get<string>(v1Keys.locale)) ?? globals.locale;
    globals.noAutoPromptBiometrics =
      (await helper.get<boolean>(v1Keys.disableAutoBiometricsPrompt)) ??
      globals.noAutoPromptBiometrics;
    globals.noAutoPromptBiometricsText =
      (await helper.get<string>(v1Keys.noAutoPromptBiometricsText)) ??
      globals.noAutoPromptBiometricsText;
    globals.ssoCodeVerifier =
      (await helper.get<string>(v1Keys.ssoCodeVerifier)) ?? globals.ssoCodeVerifier;
    globals.ssoOrganizationIdentifier =
      (await helper.get<string>(v1Keys.ssoIdentifier)) ?? globals.ssoOrganizationIdentifier;
    globals.ssoState = (await helper.get<any>(v1Keys.ssoState)) ?? globals.ssoState;
    globals.rememberedEmail =
      (await helper.get<string>(v1Keys.rememberedEmail)) ?? globals.rememberedEmail;
    globals.theme = (await helper.get<ThemeType>(v1Keys.theme)) ?? globals.theme;
    globals.vaultTimeout = (await helper.get<number>(v1Keys.vaultTimeout)) ?? globals.vaultTimeout;
    globals.vaultTimeoutAction =
      (await helper.get<string>(v1Keys.vaultTimeoutAction)) ?? globals.vaultTimeoutAction;
    globals.window = (await helper.get<any>(v1Keys.mainWindowSize)) ?? globals.window;
    globals.enableTray = (await helper.get<boolean>(v1Keys.enableTray)) ?? globals.enableTray;
    globals.enableMinimizeToTray =
      (await helper.get<boolean>(v1Keys.enableMinimizeToTray)) ?? globals.enableMinimizeToTray;
    globals.enableCloseToTray =
      (await helper.get<boolean>(v1Keys.enableCloseToTray)) ?? globals.enableCloseToTray;
    globals.enableStartToTray =
      (await helper.get<boolean>(v1Keys.enableStartToTray)) ?? globals.enableStartToTray;
    globals.openAtLogin = (await helper.get<boolean>(v1Keys.openAtLogin)) ?? globals.openAtLogin;
    globals.alwaysShowDock =
      (await helper.get<boolean>(v1Keys.alwaysShowDock)) ?? globals.alwaysShowDock;
    globals.enableBrowserIntegration =
      (await helper.get<boolean>(v1Keys.enableBrowserIntegration)) ??
      globals.enableBrowserIntegration;
    globals.enableBrowserIntegrationFingerprint =
      (await helper.get<boolean>(v1Keys.enableBrowserIntegrationFingerprint)) ??
      globals.enableBrowserIntegrationFingerprint;

    const userId =
      (await helper.get<string>(v1Keys.userId)) ?? (await helper.get<string>(v1Keys.entityId));

    const defaultAccount = this.stateFactory.createAccount(null);
    const accountSettings: AccountSettings = {
      autoConfirmFingerPrints:
        (await helper.get<boolean>(v1Keys.autoConfirmFingerprints)) ??
        defaultAccount.settings.autoConfirmFingerPrints,
      autoFillOnPageLoadDefault:
        (await helper.get<boolean>(v1Keys.autoFillOnPageLoadDefault)) ??
        defaultAccount.settings.autoFillOnPageLoadDefault,
      biometricUnlock:
        (await helper.get<boolean>(v1Keys.biometricUnlock)) ??
        defaultAccount.settings.biometricUnlock,
      clearClipboard:
        (await helper.get<number>(v1Keys.clearClipboard)) ?? defaultAccount.settings.clearClipboard,
      defaultUriMatch:
        (await helper.get<any>(v1Keys.defaultUriMatch)) ?? defaultAccount.settings.defaultUriMatch,
      disableAddLoginNotification:
        (await helper.get<boolean>(v1Keys.disableAddLoginNotification)) ??
        defaultAccount.settings.disableAddLoginNotification,
      disableAutoBiometricsPrompt:
        (await helper.get<boolean>(v1Keys.disableAutoBiometricsPrompt)) ??
        defaultAccount.settings.disableAutoBiometricsPrompt,
      disableAutoTotpCopy:
        (await helper.get<boolean>(v1Keys.disableAutoTotpCopy)) ??
        defaultAccount.settings.disableAutoTotpCopy,
      disableBadgeCounter:
        (await helper.get<boolean>(v1Keys.disableBadgeCounter)) ??
        defaultAccount.settings.disableBadgeCounter,
      disableChangedPasswordNotification:
        (await helper.get<boolean>(v1Keys.disableChangedPasswordNotification)) ??
        defaultAccount.settings.disableChangedPasswordNotification,
      disableContextMenuItem:
        (await helper.get<boolean>(v1Keys.disableContextMenuItem)) ??
        defaultAccount.settings.disableContextMenuItem,
      disableGa: (await helper.get<boolean>(v1Keys.disableGa)) ?? defaultAccount.settings.disableGa,
      dontShowCardsCurrentTab:
        (await helper.get<boolean>(v1Keys.dontShowCardsCurrentTab)) ??
        defaultAccount.settings.dontShowCardsCurrentTab,
      dontShowIdentitiesCurrentTab:
        (await helper.get<boolean>(v1Keys.dontShowIdentitiesCurrentTab)) ??
        defaultAccount.settings.dontShowIdentitiesCurrentTab,
      enableAlwaysOnTop:
        (await helper.get<boolean>(v1Keys.enableAlwaysOnTop)) ??
        defaultAccount.settings.enableAlwaysOnTop,
      enableAutoFillOnPageLoad:
        (await helper.get<boolean>(v1Keys.enableAutoFillOnPageLoad)) ??
        defaultAccount.settings.enableAutoFillOnPageLoad,
      enableBiometric:
        (await helper.get<boolean>(v1Keys.enableBiometric)) ??
        defaultAccount.settings.enableBiometric,
      enableFullWidth:
        (await helper.get<boolean>(v1Keys.enableFullWidth)) ??
        defaultAccount.settings.enableFullWidth,
      environmentUrls: globals.environmentUrls ?? defaultAccount.settings.environmentUrls,
      equivalentDomains:
        (await helper.get<any>(v1Keys.equivalentDomains)) ??
        defaultAccount.settings.equivalentDomains,
      minimizeOnCopyToClipboard:
        (await helper.get<boolean>(v1Keys.minimizeOnCopyToClipboard)) ??
        defaultAccount.settings.minimizeOnCopyToClipboard,
      neverDomains:
        (await helper.get<any>(v1Keys.neverDomains)) ?? defaultAccount.settings.neverDomains,
      passwordGenerationOptions:
        (await helper.get<any>(v1Keys.passwordGenerationOptions)) ??
        defaultAccount.settings.passwordGenerationOptions,
      pinProtected: Object.assign(new EncryptionPair<string, EncString>(), {
        decrypted: null,
        encrypted: await helper.get<string>(v1Keys.pinProtected),
      }),
      protectedPin: await helper.get<string>(v1Keys.protectedPin),
      settings:
        userId == null
          ? null
          : await helper.get<AccountSettingsSettings>(v1KeyPrefixes.settings + userId),
      vaultTimeout:
        (await helper.get<number>(v1Keys.vaultTimeout)) ?? defaultAccount.settings.vaultTimeout,
      vaultTimeoutAction:
        (await helper.get<string>(v1Keys.vaultTimeoutAction)) ??
        defaultAccount.settings.vaultTimeoutAction,
    };

    // (userId == null) = no logged in user (so no known userId) and we need to temporarily store account specific settings in state to migrate on first auth
    // (userId != null) = we have a currently authed user (so known userId) with encrypted data and other key settings we can move, no need to temporarily store account settings
    if (userId == null) {
      await helper.set(keys.tempAccountSettings, accountSettings);
      await helper.set(keys.global, globals);
      await helper.set(keys.authenticatedAccounts, []);
      await helper.set(keys.activeUserId, null);
      await clearV1Keys();
      return;
    }

    globals.twoFactorToken = await helper.get<string>(v1KeyPrefixes.twoFactorToken + userId);
    await helper.set(keys.global, globals);
    await helper.set(userId, {
      data: {
        addEditCipherInfo: null,
        ciphers: {
          decrypted: null,
          encrypted: await helper.get<{ [id: string]: CipherData }>(v1KeyPrefixes.ciphers + userId),
        },
        collapsedGroupings: null,
        collections: {
          decrypted: null,
          encrypted: await helper.get<{ [id: string]: CollectionData }>(
            v1KeyPrefixes.collections + userId
          ),
        },
        eventCollection: await helper.get<EventData[]>(v1Keys.eventCollection),
        folders: {
          decrypted: null,
          encrypted: await helper.get<{ [id: string]: FolderData }>(v1KeyPrefixes.folders + userId),
        },
        localData: null,
        organizations: await helper.get<{ [id: string]: OrganizationData }>(
          v1KeyPrefixes.organizations + userId
        ),
        passwordGenerationHistory: {
          decrypted: null,
          encrypted: await helper.get<GeneratedPasswordHistory[]>(v1Keys.history),
        },
        policies: {
          decrypted: null,
          encrypted: await helper.get<{ [id: string]: PolicyData }>(
            v1KeyPrefixes.policies + userId
          ),
        },
        providers: await helper.get<{ [id: string]: ProviderData }>(
          v1KeyPrefixes.providers + userId
        ),
        sends: {
          decrypted: null,
          encrypted: await helper.get<{ [id: string]: SendData }>(v1KeyPrefixes.sends + userId),
        },
      },
      keys: {
        apiKeyClientSecret: await helper.get<string>(v1Keys.clientSecret),
        cryptoMasterKey: null,
        cryptoMasterKeyAuto: null,
        cryptoMasterKeyB64: null,
        cryptoMasterKeyBiometric: null,
        cryptoSymmetricKey: {
          encrypted: await helper.get<string>(v1Keys.encKey),
          decrypted: null,
        },
        legacyEtmKey: null,
        organizationKeys: {
          decrypted: null,
          encrypted: await helper.get<any>(v1Keys.encOrgKeys),
        },
        privateKey: {
          decrypted: null,
          encrypted: await helper.get<string>(v1Keys.encPrivate),
        },
        providerKeys: {
          decrypted: null,
          encrypted: await helper.get<any>(v1Keys.encProviderKeys),
        },
        publicKey: null,
      },
      profile: {
        apiKeyClientId: await helper.get<string>(v1Keys.clientId),
        authenticationStatus: null,
        convertAccountToKeyConnector: await helper.get<boolean>(
          v1Keys.convertAccountToKeyConnector
        ),
        email: await helper.get<string>(v1Keys.userEmail),
        emailVerified: await helper.get<boolean>(v1Keys.emailVerified),
        entityId: null,
        entityType: null,
        everBeenUnlocked: null,
        forcePasswordReset: null,
        hasPremiumPersonally: null,
        kdfIterations: await helper.get<number>(v1Keys.kdfIterations),
        kdfType: await helper.get<KdfType>(v1Keys.kdf),
        keyHash: await helper.get<string>(v1Keys.keyHash),
        lastSync: null,
        userId: userId,
        usesKeyConnector: null,
      },
      settings: accountSettings,
      tokens: {
        accessToken: await helper.get<string>(v1Keys.accessToken),
        decodedToken: null,
        refreshToken: await helper.get<string>(v1Keys.refreshToken),
        securityStamp: null,
      },
    });

    await helper.set(keys.authenticatedAccounts, [userId]);
    await helper.set(keys.activeUserId, userId);

    const accountActivity: { [userId: string]: number } = {
      [userId]: await helper.get<number>(v1Keys.lastActive),
    };
    accountActivity[userId] = await helper.get<number>(v1Keys.lastActive);
    await helper.set(keys.accountActivity, accountActivity);

    await clearV1Keys(userId);

    if (await this.secureStorageService.has(v1Keys.key, { keySuffix: "biometric" })) {
      await this.secureStorageService.save(
        `${userId}${partialKeys.biometricKey}`,
        await this.secureStorageService.get(v1Keys.key, { keySuffix: "biometric" }),
        { keySuffix: "biometric" }
      );
      await this.secureStorageService.remove(v1Keys.key, { keySuffix: "biometric" });
    }

    if (await this.secureStorageService.has(v1Keys.key, { keySuffix: "auto" })) {
      await this.secureStorageService.save(
        `${userId}${partialKeys.autoKey}`,
        await this.secureStorageService.get(v1Keys.key, { keySuffix: "auto" }),
        { keySuffix: "auto" }
      );
      await this.secureStorageService.remove(v1Keys.key, { keySuffix: "auto" });
    }

    if (await this.secureStorageService.has(v1Keys.key)) {
      await this.secureStorageService.save(
        `${userId}${partialKeys.masterKey}`,
        await this.secureStorageService.get(v1Keys.key)
      );
      await this.secureStorageService.remove(v1Keys.key);
    }
  }
}

// Originally (before January 2022) storage was handled as a flat key/value pair store.
// With the move to a typed object for state storage these keys should no longer be in use anywhere outside of this migration.
const v1Keys: { [key: string]: string } = {
  accessToken: "accessToken",
  alwaysShowDock: "alwaysShowDock",
  autoConfirmFingerprints: "autoConfirmFingerprints",
  autoFillOnPageLoadDefault: "autoFillOnPageLoadDefault",
  biometricAwaitingAcceptance: "biometricAwaitingAcceptance",
  biometricFingerprintValidated: "biometricFingerprintValidated",
  biometricText: "biometricText",
  biometricUnlock: "biometric",
  clearClipboard: "clearClipboardKey",
  clientId: "apikey_clientId",
  clientSecret: "apikey_clientSecret",
  collapsedGroupings: "collapsedGroupings",
  convertAccountToKeyConnector: "convertAccountToKeyConnector",
  defaultUriMatch: "defaultUriMatch",
  disableAddLoginNotification: "disableAddLoginNotification",
  disableAutoBiometricsPrompt: "noAutoPromptBiometrics",
  disableAutoTotpCopy: "disableAutoTotpCopy",
  disableBadgeCounter: "disableBadgeCounter",
  disableChangedPasswordNotification: "disableChangedPasswordNotification",
  disableContextMenuItem: "disableContextMenuItem",
  disableFavicon: "disableFavicon",
  disableGa: "disableGa",
  dontShowCardsCurrentTab: "dontShowCardsCurrentTab",
  dontShowIdentitiesCurrentTab: "dontShowIdentitiesCurrentTab",
  emailVerified: "emailVerified",
  enableAlwaysOnTop: "enableAlwaysOnTopKey",
  enableAutoFillOnPageLoad: "enableAutoFillOnPageLoad",
  enableBiometric: "enabledBiometric",
  enableBrowserIntegration: "enableBrowserIntegration",
  enableBrowserIntegrationFingerprint: "enableBrowserIntegrationFingerprint",
  enableCloseToTray: "enableCloseToTray",
  enableFullWidth: "enableFullWidth",
  enableMinimizeToTray: "enableMinimizeToTray",
  enableStartToTray: "enableStartToTrayKey",
  enableTray: "enableTray",
  encKey: "encKey", // Generated Symmetric Key
  encOrgKeys: "encOrgKeys",
  encPrivate: "encPrivateKey",
  encProviderKeys: "encProviderKeys",
  entityId: "entityId",
  entityType: "entityType",
  environmentUrls: "environmentUrls",
  equivalentDomains: "equivalentDomains",
  eventCollection: "eventCollection",
  forcePasswordReset: "forcePasswordReset",
  history: "generatedPasswordHistory",
  installedVersion: "installedVersion",
  kdf: "kdf",
  kdfIterations: "kdfIterations",
  key: "key", // Master Key
  keyHash: "keyHash",
  lastActive: "lastActive",
  localData: "sitesLocalData",
  locale: "locale",
  mainWindowSize: "mainWindowSize",
  minimizeOnCopyToClipboard: "minimizeOnCopyToClipboardKey",
  neverDomains: "neverDomains",
  noAutoPromptBiometricsText: "noAutoPromptBiometricsText",
  openAtLogin: "openAtLogin",
  passwordGenerationOptions: "passwordGenerationOptions",
  pinProtected: "pinProtectedKey",
  protectedPin: "protectedPin",
  refreshToken: "refreshToken",
  ssoCodeVerifier: "ssoCodeVerifier",
  ssoIdentifier: "ssoOrgIdentifier",
  ssoState: "ssoState",
  stamp: "securityStamp",
  theme: "theme",
  userEmail: "userEmail",
  userId: "userId",
  usesConnector: "usesKeyConnector",
  vaultTimeoutAction: "vaultTimeoutAction",
  vaultTimeout: "lockOption",
  rememberedEmail: "rememberedEmail",
};

const v1KeyPrefixes: { [key: string]: string } = {
  ciphers: "ciphers_",
  collections: "collections_",
  folders: "folders_",
  lastSync: "lastSync_",
  policies: "policies_",
  twoFactorToken: "twoFactorToken_",
  organizations: "organizations_",
  providers: "providers_",
  sends: "sends_",
  settings: "settings_",
};
