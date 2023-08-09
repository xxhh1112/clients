import { arrayDeserializer } from "@bitwarden/common/platform/misc/deserializers";
import { Folder } from "@bitwarden/common/vault/models/domain/folder";
import { FolderView } from "@bitwarden/common/vault/models/view/folder.view";
import { FolderService } from "@bitwarden/common/vault/services/folder/folder.service";

import { ForegroundBitSubject } from "../../../platform/utils/foreground-bit-subject";

export class ForegroundFolderService extends FolderService {
  protected _folders = new ForegroundBitSubject<Folder[]>(
    "folderService_folders",
    arrayDeserializer<Folder>(Folder.fromJSON)
  );
  protected _folderViews = new ForegroundBitSubject<FolderView[]>(
    "folderService_folderViews",
    arrayDeserializer<FolderView>(FolderView.fromJSON)
  );

  async init(): Promise<ForegroundFolderService> {
    await this._folders.init([]);
    await this._folderViews.init([]);
    return this;
  }
}
