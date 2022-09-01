import { BehaviorSubject, from, map, concatMap, Observable, firstValueFrom } from "rxjs";

import { InternalCipherService as InternalCipherServiceAbstraction } from "../../abstractions/cipher/cipher.service.abstraction";
import { CryptoService } from "../../abstractions/crypto.service";
import { I18nService } from "../../abstractions/i18n.service";
import { LogService } from "../../abstractions/log.service";
import { SettingsService } from "../../abstractions/settings.service";
import { StateService } from "../../abstractions/state.service";
import { CipherType } from "../../enums/cipherType";
import { FieldType } from "../../enums/fieldType";
import { UriMatchType } from "../../enums/uriMatchType";
import { Utils } from "../../misc/utils";
import { CipherData } from "../../models/data/cipherData";
import { Attachment } from "../../models/domain/attachment";
import { Card } from "../../models/domain/card";
import { Cipher } from "../../models/domain/cipher";
import Domain from "../../models/domain/domainBase";
import { EncString } from "../../models/domain/encString";
import { Field } from "../../models/domain/field";
import { Identity } from "../../models/domain/identity";
import { Login } from "../../models/domain/login";
import { LoginUri } from "../../models/domain/loginUri";
import { Password } from "../../models/domain/password";
import { SecureNote } from "../../models/domain/secureNote";
import { SortedCiphersCache } from "../../models/domain/sortedCiphersCache";
import { SymmetricCryptoKey } from "../../models/domain/symmetricCryptoKey";
import { AttachmentView } from "../../models/view/attachmentView";
import { CipherView } from "../../models/view/cipherView";
import { FieldView } from "../../models/view/fieldView";
import { PasswordHistoryView } from "../../models/view/passwordHistoryView";
import { View } from "../../models/view/view";

const DomainMatchBlacklist = new Map<string, Set<string>>([
  ["google.com", new Set(["script.google.com"])],
]);

export class CipherService implements InternalCipherServiceAbstraction {
  protected _ciphers: BehaviorSubject<Cipher[]> = new BehaviorSubject([]);
  protected _cipherViews: BehaviorSubject<CipherView[]> = new BehaviorSubject([]);

  ciphers$ = this._ciphers.asObservable();
  cipherViews$ = this._cipherViews.asObservable();

  private sortedCiphersCache: SortedCiphersCache = new SortedCiphersCache(
    this.sortCiphersByLastUsed
  );

  constructor(
    private cryptoService: CryptoService,
    private settingsService: SettingsService,
    private i18nService: I18nService,
    private logService: LogService,
    private stateService: StateService
  ) {
    this.stateService.activeAccountUnlocked$
      .pipe(
        concatMap(async (unlocked) => {
          if (Utils.global.bitwardenContainerService == null) {
            return;
          }

          if (!unlocked) {
            this._ciphers.next([]);
            this._cipherViews.next([]);
            return;
          }

          const data = await this.stateService.getEncryptedCiphers();

          await this.updateObservables(data);
        })
      )
      .subscribe();
  }

  async encrypt(
    model: CipherView,
    key?: SymmetricCryptoKey,
    originalCipher?: Cipher
  ): Promise<Cipher> {
    if (model.id != null) {
      if (originalCipher == null) {
        originalCipher = await this.get(model.id);
      }
      if (originalCipher != null) {
        const existingCiphers = await this.decryptCiphers([originalCipher]);
        const existingCipher = existingCiphers[0];
        model.passwordHistory = existingCipher.passwordHistory || [];
        if (model.type === CipherType.Login && existingCipher.type === CipherType.Login) {
          if (
            existingCipher.login.password != null &&
            existingCipher.login.password !== "" &&
            existingCipher.login.password !== model.login.password
          ) {
            const ph = new PasswordHistoryView();
            ph.password = existingCipher.login.password;
            ph.lastUsedDate = model.login.passwordRevisionDate = new Date();
            model.passwordHistory.splice(0, 0, ph);
          } else {
            model.login.passwordRevisionDate = existingCipher.login.passwordRevisionDate;
          }
        }
        if (existingCipher.hasFields) {
          const existingHiddenFields = existingCipher.fields.filter(
            (f) =>
              f.type === FieldType.Hidden &&
              f.name != null &&
              f.name !== "" &&
              f.value != null &&
              f.value !== ""
          );
          const hiddenFields =
            model.fields == null
              ? []
              : model.fields.filter(
                  (f) => f.type === FieldType.Hidden && f.name != null && f.name !== ""
                );
          existingHiddenFields.forEach((ef) => {
            const matchedField = hiddenFields.find((f) => f.name === ef.name);
            if (matchedField == null || matchedField.value !== ef.value) {
              const ph = new PasswordHistoryView();
              ph.password = ef.name + ": " + ef.value;
              ph.lastUsedDate = new Date();
              model.passwordHistory.splice(0, 0, ph);
            }
          });
        }
      }
      if (model.passwordHistory != null && model.passwordHistory.length === 0) {
        model.passwordHistory = null;
      } else if (model.passwordHistory != null && model.passwordHistory.length > 5) {
        // only save last 5 history
        model.passwordHistory = model.passwordHistory.slice(0, 5);
      }
    }

    const cipher = new Cipher();
    cipher.id = model.id;
    cipher.folderId = model.folderId;
    cipher.favorite = model.favorite;
    cipher.organizationId = model.organizationId;
    cipher.type = model.type;
    cipher.collectionIds = model.collectionIds;
    cipher.revisionDate = model.revisionDate;
    cipher.reprompt = model.reprompt;

    if (key == null && cipher.organizationId != null) {
      key = await this.cryptoService.getOrgKey(cipher.organizationId);
      if (key == null) {
        throw new Error("Cannot encrypt cipher for organization. No key.");
      }
    }
    await Promise.all([
      this.encryptObjProperty(
        model,
        cipher,
        {
          name: null,
          notes: null,
        },
        key
      ),
      this.encryptCipherData(cipher, model, key),
      this.encryptFields(model.fields, key).then((fields) => {
        cipher.fields = fields;
      }),
      this.encryptPasswordHistories(model.passwordHistory, key).then((ph) => {
        cipher.passwordHistory = ph;
      }),
      this.encryptAttachments(model.attachments, key).then((attachments) => {
        cipher.attachments = attachments;
      }),
    ]);

    return cipher;
  }

  async get(id: string): Promise<Cipher> {
    const ciphers = this._ciphers.getValue();
    const response = ciphers.find((obj) => {
      return obj.id === id;
    });
    return response;
  }

  async getAll(): Promise<Cipher[]> {
    const cipherMap = await this.stateService.getEncryptedCiphers();
    const response = Object.values(cipherMap || {}).map((c) => new Cipher(c));
    return response;
  }

  getLocaleSortingFunction(): (a: CipherView, b: CipherView) => number {
    return (a, b) => {
      let aName = a.name;
      let bName = b.name;

      if (aName == null && bName != null) {
        return -1;
      }
      if (aName != null && bName == null) {
        return 1;
      }
      if (aName == null && bName == null) {
        return 0;
      }

      const result = this.i18nService.collator
        ? this.i18nService.collator.compare(aName, bName)
        : aName.localeCompare(bName);

      if (result !== 0 || a.type !== CipherType.Login || b.type !== CipherType.Login) {
        return result;
      }

      if (a.login.username != null) {
        aName += a.login.username;
      }

      if (b.login.username != null) {
        bName += b.login.username;
      }

      return this.i18nService.collator
        ? this.i18nService.collator.compare(aName, bName)
        : aName.localeCompare(bName);
    };
  }

  getAllDecrypted$(): Observable<CipherView[]> {
    return this.cipherViews$;
  }

  getAllDecryptedForGrouping$(groupingId: string, folder = true): Observable<CipherView[]> {
    return this.cipherViews$.pipe(
      map((ciphers) => {
        return ciphers.filter((c) => {
          if (c.isDeleted) {
            return false;
          }

          return (
            (folder && c.folderId === groupingId) ||
            (!folder && c.collectionIds != null && c.collectionIds.indexOf(groupingId) !== -1)
          );
        });
      })
    );
  }

  getAllDecryptedForUrl$(
    url: string,
    includeOtherTypes?: CipherType[],
    defaultMatch: UriMatchType = null
  ): Observable<CipherView[]> {
    const domain = Utils.getDomain(url);

    return this.getEquivalentDomain$(domain).pipe(
      concatMap((result) =>
        this.filterAllDecrypteUrls$(includeOtherTypes, url, defaultMatch, domain, result)
      )
    );
  }

  getLastUsedForUrl(url: string, autofillOnPageLoad = false): Promise<CipherView> {
    return this.getCipherForUrl(url, true, false, autofillOnPageLoad);
  }

  getLastLaunchedForUrl(url: string, autofillOnPageLoad = false): Promise<CipherView> {
    return this.getCipherForUrl(url, false, true, autofillOnPageLoad);
  }

  getNextCipherForUrl(url: string): Promise<CipherView> {
    return this.getCipherForUrl(url, false, false, false);
  }

  updateLastUsedIndexForUrl(url: string) {
    this.sortedCiphersCache.updateLastUsedIndex(url);
  }

  async updateLastUsedDate(id: string): Promise<void> {
    let ciphersLocalData = await this.stateService.getLocalData();
    if (!ciphersLocalData) {
      ciphersLocalData = {};
    }

    if (ciphersLocalData[id]) {
      ciphersLocalData[id].lastUsedDate = new Date().getTime();
    } else {
      ciphersLocalData[id] = {
        lastUsedDate: new Date().getTime(),
      };
    }

    await this.stateService.setLocalData(ciphersLocalData);

    const decryptedCipherCache = await this.stateService.getDecryptedCiphers();
    if (!decryptedCipherCache) {
      return;
    }

    for (let i = 0; i < decryptedCipherCache.length; i++) {
      const cached = decryptedCipherCache[i];
      if (cached.id === id) {
        cached.localData = ciphersLocalData[id];
        break;
      }
    }
    await this.stateService.setDecryptedCiphers(decryptedCipherCache);
  }

  async updateLastLaunchedDate(id: string): Promise<void> {
    let ciphersLocalData = await this.stateService.getLocalData();
    if (!ciphersLocalData) {
      ciphersLocalData = {};
    }

    if (ciphersLocalData[id]) {
      ciphersLocalData[id].lastLaunched = new Date().getTime();
    } else {
      ciphersLocalData[id] = {
        lastUsedDate: new Date().getTime(),
      };
    }

    await this.stateService.setLocalData(ciphersLocalData);

    const decryptedCipherCache = await this.stateService.getDecryptedCiphers();
    if (!decryptedCipherCache) {
      return;
    }

    for (let i = 0; i < decryptedCipherCache.length; i++) {
      const cached = decryptedCipherCache[i];
      if (cached.id === id) {
        cached.localData = ciphersLocalData[id];
        break;
      }
    }
    await this.stateService.setDecryptedCiphers(decryptedCipherCache);
  }

  async saveNeverDomain(domain: string): Promise<void> {
    if (domain == null) {
      return;
    }

    let domains = await this.stateService.getNeverDomains();
    if (!domains) {
      domains = {};
    }
    domains[domain] = null;
    await this.stateService.setNeverDomains(domains);
  }

  async upsert(cipher: CipherData | CipherData[]): Promise<any> {
    let ciphers = await this.stateService.getEncryptedCiphers();
    if (ciphers == null) {
      ciphers = {};
    }

    if (cipher instanceof CipherData) {
      const c = cipher as CipherData;
      ciphers[c.id] = c;
    } else {
      (cipher as CipherData[]).forEach((c) => {
        ciphers[c.id] = c;
      });
    }

    await this.updateObservables(ciphers);
    await this.stateService.setEncryptedCiphers(ciphers);
  }

  async replace(ciphers: { [id: string]: CipherData }): Promise<any> {
    await this.updateObservables(ciphers);
    await this.stateService.setEncryptedCiphers(ciphers);
  }

  async clear(userId?: string): Promise<any> {
    if (userId == null || userId == (await this.stateService.getUserId())) {
      this._ciphers.next([]);
      this._cipherViews.next([]);
    }
    await this.stateService.setEncryptedCiphers(null, { userId: userId });
  }

  async clearCache(userId?: string): Promise<void> {
    await this.stateService.setDecryptedCiphers(null, { userId: userId });
    this._cipherViews.next([]);
    this.sortedCiphersCache.clear();
  }

  async delete(id: string | string[]): Promise<any> {
    const ciphers = await this.stateService.getEncryptedCiphers();
    if (ciphers == null) {
      return;
    }

    if (typeof id === "string") {
      if (ciphers[id] == null) {
        return;
      }
      delete ciphers[id];
    } else {
      (id as string[]).forEach((i) => {
        delete ciphers[i];
      });
    }

    await this.clearCache();
    await this.updateObservables(ciphers);
    await this.stateService.setEncryptedCiphers(ciphers);
  }

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    const ciphers = await this.stateService.getEncryptedCiphers();

    // eslint-disable-next-line
    if (ciphers == null || !ciphers.hasOwnProperty(id) || ciphers[id].attachments == null) {
      return;
    }

    for (let i = 0; i < ciphers[id].attachments.length; i++) {
      if (ciphers[id].attachments[i].id === attachmentId) {
        ciphers[id].attachments.splice(i, 1);
      }
    }

    await this.clearCache();
    await this.updateObservables(ciphers);
    await this.stateService.setEncryptedCiphers(ciphers);
  }

  sortCiphersByLastUsed(a: CipherView, b: CipherView): number {
    const aLastUsed = this.getLastUsed(a);
    const bLastUsed = this.getLastUsed(b);
    const bothNotNull = this.ValidateLastUsedNotNull(aLastUsed, bLastUsed);

    if (this.validateaLastUsed(bothNotNull, aLastUsed, bLastUsed)) {
      return -1;
    }

    if (this.validatebLastUsed(bLastUsed, aLastUsed, bothNotNull)) {
      return 1;
    }

    return 0;
  }

  sortCiphersByLastUsedThenName(a: CipherView, b: CipherView): number {
    const result = this.sortCiphersByLastUsed(a, b);
    if (result !== 0) {
      return result;
    }

    return this.getLocaleSortingFunction()(a, b);
  }

  async softDelete(id: string | string[]): Promise<any> {
    const ciphers = await this.stateService.getEncryptedCiphers();
    if (ciphers == null) {
      return;
    }

    const setDeletedDate = (cipherId: string) => {
      if (ciphers[cipherId] == null) {
        return;
      }
      ciphers[cipherId].deletedDate = new Date().toISOString();
    };

    if (typeof id === "string") {
      setDeletedDate(id);
    } else {
      (id as string[]).forEach(setDeletedDate);
    }

    await this.clearCache();
    await this.updateObservables(ciphers);
    await this.stateService.setEncryptedCiphers(ciphers);
  }

  async restore(
    cipher: { id: string; revisionDate: string } | { id: string; revisionDate: string }[]
  ) {
    const ciphers = await this.stateService.getEncryptedCiphers();
    if (ciphers == null) {
      return;
    }

    const clearDeletedDate = (c: { id: string; revisionDate: string }) => {
      if (ciphers[c.id] == null) {
        return;
      }
      ciphers[c.id].deletedDate = null;
      ciphers[c.id].revisionDate = c.revisionDate;
    };

    if (cipher.constructor.name === Array.name) {
      (cipher as { id: string; revisionDate: string }[]).forEach(clearDeletedDate);
    } else {
      clearDeletedDate(cipher as { id: string; revisionDate: string });
    }

    await this.clearCache();
    await this.updateObservables(ciphers);
    await this.stateService.setEncryptedCiphers(ciphers);
  }

  private filterAllDecrypteUrls$(
    includeOtherTypes: CipherType[],
    url: string,
    defaultMatch: UriMatchType,
    domain: string,
    matchingDomains: string[]
  ): Observable<CipherView[]> {
    return this.cipherViews$.pipe(
      map((ciphers) => {
        return ciphers.filter((cipher) => {
          if (cipher.deletedDate != null) {
            return false;
          }

          if (includeOtherTypes != null && includeOtherTypes.indexOf(cipher.type) > -1) {
            return true;
          }

          if (url != null && cipher.type === CipherType.Login && cipher.login.uris != null) {
            for (let i = 0; i < cipher.login.uris.length; i++) {
              const u = cipher.login.uris[i];
              if (u.uri == null) {
                continue;
              }

              const match = u.match == null ? defaultMatch : u.match;
              switch (match) {
                case UriMatchType.Domain:
                  if (
                    domain != null &&
                    u.domain != null &&
                    matchingDomains.indexOf(u.domain) > -1
                  ) {
                    if (DomainMatchBlacklist.has(u.domain)) {
                      const domainUrlHost = Utils.getHost(url);
                      if (!DomainMatchBlacklist.get(u.domain).has(domainUrlHost)) {
                        return true;
                      }
                    } else {
                      return true;
                    }
                  }
                  break;
                case UriMatchType.Host: {
                  const urlHost = Utils.getHost(url);
                  if (urlHost != null && urlHost === Utils.getHost(u.uri)) {
                    return true;
                  }
                  break;
                }
                case UriMatchType.Exact:
                  if (url === u.uri) {
                    return true;
                  }
                  break;
                case UriMatchType.StartsWith:
                  if (url.startsWith(u.uri)) {
                    return true;
                  }
                  break;
                case UriMatchType.RegularExpression:
                  try {
                    const regex = new RegExp(u.uri, "i");
                    if (regex.test(url)) {
                      return true;
                    }
                  } catch (e) {
                    this.logService.error(e);
                  }
                  break;
                case UriMatchType.Never:
                default:
                  break;
              }
            }
          }

          return false;
        });
      })
    );
  }

  private async encryptFields(fieldsModel: FieldView[], key: SymmetricCryptoKey): Promise<Field[]> {
    if (!fieldsModel || !fieldsModel.length) {
      return null;
    }

    const self = this;
    const encFields: Field[] = [];
    await fieldsModel.reduce(async (promise, field) => {
      await promise;
      const encField = await self.encryptField(field, key);
      encFields.push(encField);
    }, Promise.resolve());

    return encFields;
  }

  private async encryptField(fieldModel: FieldView, key: SymmetricCryptoKey): Promise<Field> {
    const field = new Field();
    field.type = fieldModel.type;
    field.linkedId = fieldModel.linkedId;
    // normalize boolean type field values
    if (fieldModel.type === FieldType.Boolean && fieldModel.value !== "true") {
      fieldModel.value = "false";
    }

    await this.encryptObjProperty(
      fieldModel,
      field,
      {
        name: null,
        value: null,
      },
      key
    );

    return field;
  }

  private async encryptPasswordHistories(
    phModels: PasswordHistoryView[],
    key: SymmetricCryptoKey
  ): Promise<Password[]> {
    if (!phModels || !phModels.length) {
      return null;
    }

    const self = this;
    const encPhs: Password[] = [];
    await phModels.reduce(async (promise, ph) => {
      await promise;
      const encPh = await self.encryptPasswordHistory(ph, key);
      encPhs.push(encPh);
    }, Promise.resolve());

    return encPhs;
  }

  private async encryptPasswordHistory(
    phModel: PasswordHistoryView,
    key: SymmetricCryptoKey
  ): Promise<Password> {
    const ph = new Password();
    ph.lastUsedDate = phModel.lastUsedDate;

    await this.encryptObjProperty(
      phModel,
      ph,
      {
        password: null,
      },
      key
    );

    return ph;
  }

  private async encryptAttachments(
    attachmentsModel: AttachmentView[],
    key: SymmetricCryptoKey
  ): Promise<Attachment[]> {
    if (attachmentsModel == null || attachmentsModel.length === 0) {
      return null;
    }

    const promises: Promise<any>[] = [];
    const encAttachments: Attachment[] = [];
    attachmentsModel.forEach(async (model) => {
      const attachment = new Attachment();
      attachment.id = model.id;
      attachment.size = model.size;
      attachment.sizeName = model.sizeName;
      attachment.url = model.url;
      const promise = this.encryptObjProperty(
        model,
        attachment,
        {
          fileName: null,
        },
        key
      ).then(async () => {
        if (model.key != null) {
          attachment.key = await this.cryptoService.encrypt(model.key.key, key);
        }
        encAttachments.push(attachment);
      });
      promises.push(promise);
    });

    await Promise.all(promises);
    return encAttachments;
  }

  private validateaLastUsed(bothNotNull: boolean, aLastUsed: number, bLastUsed: number) {
    return (bothNotNull && aLastUsed > bLastUsed) || (aLastUsed != null && bLastUsed == null);
  }

  private validatebLastUsed(bLastUsed: number, aLastUsed: number, bothNotNull: boolean) {
    return (bLastUsed != null && aLastUsed == null) || (bothNotNull && aLastUsed < bLastUsed);
  }

  private ValidateLastUsedNotNull(aLastUsed: number, bLastUsed: number) {
    return aLastUsed != null && bLastUsed != null;
  }

  private getLastUsed(a: CipherView) {
    return a.localData && a.localData.lastUsedDate ? (a.localData.lastUsedDate as number) : null;
  }

  private async encryptObjProperty<V extends View, D extends Domain>(
    model: V,
    obj: D,
    map: any,
    key: SymmetricCryptoKey
  ): Promise<void> {
    const promises = [];
    const self = this;

    for (const prop in map) {
      // eslint-disable-next-line
      if (!map.hasOwnProperty(prop)) {
        continue;
      }

      (function (theProp, theObj) {
        const p = Promise.resolve()
          .then(() => {
            const modelProp = (model as any)[map[theProp] || theProp];
            if (modelProp && modelProp !== "") {
              return self.cryptoService.encrypt(modelProp, key);
            }
            return null;
          })
          .then((val: EncString) => {
            (theObj as any)[theProp] = val;
          });
        promises.push(p);
      })(prop, obj);
    }

    await Promise.all(promises);
  }

  private async encryptCipherData(cipher: Cipher, model: CipherView, key: SymmetricCryptoKey) {
    switch (cipher.type) {
      case CipherType.Login:
        await this.cipherTypeLogin(cipher, model, key);
        return;
      case CipherType.SecureNote:
        this.cipherTypeSecureNote(cipher, model);
        return;
      case CipherType.Card:
        await this.cipherTypeCard(cipher, model, key);
        return;
      case CipherType.Identity:
        await this.cipherTypeIdentity(cipher, model, key);
        return;
      default:
        throw new Error("Unknown cipher type.");
    }
  }

  private async cipherTypeIdentity(cipher: Cipher, model: CipherView, key: SymmetricCryptoKey) {
    cipher.identity = new Identity();
    await this.encryptObjProperty(
      model.identity,
      cipher.identity,
      {
        title: null,
        firstName: null,
        middleName: null,
        lastName: null,
        address1: null,
        address2: null,
        address3: null,
        city: null,
        state: null,
        postalCode: null,
        country: null,
        company: null,
        email: null,
        phone: null,
        ssn: null,
        username: null,
        passportNumber: null,
        licenseNumber: null,
      },
      key
    );
  }

  private async cipherTypeCard(cipher: Cipher, model: CipherView, key: SymmetricCryptoKey) {
    cipher.card = new Card();
    await this.encryptObjProperty(
      model.card,
      cipher.card,
      {
        cardholderName: null,
        brand: null,
        number: null,
        expMonth: null,
        expYear: null,
        code: null,
      },
      key
    );
  }

  private cipherTypeSecureNote(cipher: Cipher, model: CipherView) {
    cipher.secureNote = new SecureNote();
    cipher.secureNote.type = model.secureNote.type;
  }

  private async cipherTypeLogin(cipher: Cipher, model: CipherView, key: SymmetricCryptoKey) {
    cipher.login = new Login();
    cipher.login.passwordRevisionDate = model.login.passwordRevisionDate;
    cipher.login.autofillOnPageLoad = model.login.autofillOnPageLoad;
    await this.encryptObjProperty(
      model.login,
      cipher.login,
      {
        username: null,
        password: null,
        totp: null,
      },
      key
    );

    if (model.login.uris != null) {
      cipher.login.uris = [];
      for (let i = 0; i < model.login.uris.length; i++) {
        const loginUri = new LoginUri();
        loginUri.match = model.login.uris[i].match;
        await this.encryptObjProperty(
          model.login.uris[i],
          loginUri,
          {
            uri: null,
          },
          key
        );
        cipher.login.uris.push(loginUri);
      }
    }
  }

  private async getCipherForUrl(
    url: string,
    lastUsed: boolean,
    lastLaunched: boolean,
    autofillOnPageLoad: boolean
  ): Promise<CipherView> {
    const cacheKey = autofillOnPageLoad ? "autofillOnPageLoad-" + url : url;

    if (!this.sortedCiphersCache.isCached(cacheKey)) {
      const ciphers = await firstValueFrom(this.getAllDecryptedForUrl$(url));
      if (!ciphers) {
        return null;
      }

      if (autofillOnPageLoad) {
        const autofillOnPageLoadDefault = await this.stateService.getAutoFillOnPageLoadDefault();
        ciphers.filter((cipher) => {
          cipher.login.autofillOnPageLoad ||
            (cipher.login.autofillOnPageLoad == null && autofillOnPageLoadDefault !== false);
        });

        if (ciphers.length === 0) {
          return null;
        }
      }

      this.sortedCiphersCache.addCiphers(cacheKey, ciphers);
    }

    if (lastLaunched) {
      return this.sortedCiphersCache.getLastLaunched(cacheKey);
    } else if (lastUsed) {
      return this.sortedCiphersCache.getLastUsed(cacheKey);
    } else {
      return this.sortedCiphersCache.getNext(cacheKey);
    }
  }

  private getEquivalentDomain$(domain: string) {
    return domain == null
      ? from(Promise.resolve([]))
      : from(
          Promise.resolve(this.settingsService.getEquivalentDomains()).then(
            (eqDomains: any[][]) => {
              let matches: any[] = [];
              eqDomains.forEach((eqDomain) => {
                if (eqDomain.length && eqDomain.indexOf(domain) >= 0) {
                  matches = matches.concat(eqDomain);
                }
              });

              if (!matches.length) {
                matches.push(domain);
              }

              return matches;
            }
          )
        );
  }

  private async updateObservables(ciphersMap: { [id: string]: CipherData }) {
    const ciphers = Object.values(ciphersMap || {}).map((c) => new Cipher(c));

    this._ciphers.next(ciphers);

    if (await this.cryptoService.hasKey()) {
      this._cipherViews.next(await this.decryptCiphers(ciphers));
    }
  }

  private async decryptCiphers(ciphers: Cipher[]): Promise<CipherView[]> {
    const decryptCipherPromises = ciphers.map((c) => c.decrypt());
    const decryptedCiphers = await Promise.all(decryptCipherPromises);

    decryptedCiphers.sort(this.getLocaleSortingFunction());

    return decryptedCiphers;
  }
}
