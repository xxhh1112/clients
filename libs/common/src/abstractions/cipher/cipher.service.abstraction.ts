import { CipherType } from "@bitwarden/common/enums/cipherType";
import { UriMatchType } from "@bitwarden/common/enums/uriMatchType";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { Field } from "@bitwarden/common/models/domain/field";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { CipherView } from "@bitwarden/common/models/view/cipherView";
import { FieldView } from "@bitwarden/common/models/view/fieldView";

export abstract class CipherService {
  clearCache: (userId?: string) => Promise<void>;
  encrypt: (
    model: CipherView,
    key?: SymmetricCryptoKey,
    originalCipher?: Cipher
  ) => Promise<Cipher>;
  encryptFields: (fieldsModel: FieldView[], key: SymmetricCryptoKey) => Promise<Field[]>;
  encryptField: (fieldModel: FieldView, key: SymmetricCryptoKey) => Promise<Field>;
  get: (id: string) => Promise<Cipher>;
  getAll: () => Promise<Cipher[]>;
  getAllDecrypted: () => Promise<CipherView[]>;
  getAllDecryptedForGrouping: (groupingId: string, folder?: boolean) => Promise<CipherView[]>;
  getAllDecryptedForUrl: (
    url: string,
    includeOtherTypes?: CipherType[],
    defaultMatch?: UriMatchType
  ) => Promise<CipherView[]>;
  getAllFromApiForOrganization: (organizationId: string) => Promise<CipherView[]>;
  getLastUsedForUrl: (url: string, autofillOnPageLoad: boolean) => Promise<CipherView>;
  getLastLaunchedForUrl: (url: string, autofillOnPageLoad: boolean) => Promise<CipherView>;
  getNextCipherForUrl: (url: string) => Promise<CipherView>;
  updateLastUsedIndexForUrl: (url: string) => void;
  updateLastUsedDate: (id: string) => Promise<void>;
  updateLastLaunchedDate: (id: string) => Promise<void>;
  saveNeverDomain: (domain: string) => Promise<void>;

  deleteAttachment: (id: string, attachmentId: string) => Promise<void>;
  sortCiphersByLastUsed: (a: any, b: any) => number;
  sortCiphersByLastUsedThenName: (a: any, b: any) => number;
  getLocaleSortingFunction: () => (a: CipherView, b: CipherView) => number;
  softDelete: (id: string | string[]) => Promise<any>;

  restore: (
    cipher: { id: string; revisionDate: string } | { id: string; revisionDate: string }[]
  ) => Promise<any>;
}

export abstract class InternalCipherService extends CipherService {
  upsert: (cipher: CipherData | CipherData[]) => Promise<any>;
  replace: (ciphers: { [id: string]: CipherData }) => Promise<any>;
  clear: (userId: string) => Promise<any>;
  delete: (id: string | string[]) => Promise<any>;
}
