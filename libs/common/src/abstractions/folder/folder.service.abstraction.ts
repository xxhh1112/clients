import { Observable } from "rxjs";

import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderView } from "../../models/view/folder.view";

export abstract class FolderService {
  folders$: Observable<Folder[]>;
  folderViews$: Observable<FolderView[]>;

  clearCache: () => Promise<void>;
  get: (id: string) => Promise<Folder>;
  /**
   * @deprecated Only use in CLI!
   */
  getAllDecryptedFromState: () => Promise<FolderView[]>;
}

export abstract class InternalFolderService extends FolderService {
  upsert: (folder: FolderData | FolderData[]) => Promise<void>;
  replace: (folders: { [id: string]: FolderData }) => Promise<void>;
  clear: (userId: string) => Promise<any>;
  delete: (id: string | string[]) => Promise<any>;
}
