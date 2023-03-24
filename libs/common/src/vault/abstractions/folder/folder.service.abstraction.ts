import { Observable } from "rxjs";

import { SymmetricCryptoKey } from "../../../models/domain/symmetric-crypto-key";
import { Guid } from "../../../types/guid";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderView } from "../../models/view/folder.view";

export abstract class FolderService {
  folders$: Observable<Folder[]>;
  folderViews$: Observable<FolderView[]>;

  clearCache: () => Promise<void>;
  encrypt: (model: FolderView, key?: SymmetricCryptoKey) => Promise<Folder>;
  get: (folderId: string) => Promise<Folder>;
  getAllFromState: () => Promise<Folder[]>;
  /**
   * @deprecated Only use in CLI!
   */
  getFromState: (folderId: string) => Promise<Folder>;
  /**
   * @deprecated Only use in CLI!
   */
  getAllDecryptedFromState: () => Promise<FolderView[]>;
}

export abstract class InternalFolderService extends FolderService {
  upsert: (folder: FolderData) => Promise<void>;
  replace: (folders: Record<Guid, FolderData>) => Promise<void>;
  clear: (userId: string) => Promise<any>;
  delete: (folderId: string) => Promise<any>;
}
