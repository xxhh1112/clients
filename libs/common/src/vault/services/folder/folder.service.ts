import { BehaviorSubject, combineLatestWith, concatMap } from "rxjs";

import { CryptoService } from "../../../abstractions/crypto.service";
import { I18nService } from "../../../abstractions/i18n.service";
import { StateService } from "../../../abstractions/state.service";
import { Utils } from "../../../misc/utils";
import { SymmetricCryptoKey } from "../../../models/domain/symmetric-crypto-key";
import { Guid } from "../../../types/guid";
import { CipherService } from "../../../vault/abstractions/cipher.service";
import { InternalFolderService as InternalFolderServiceAbstraction } from "../../../vault/abstractions/folder/folder.service.abstraction";
import { CipherData } from "../../../vault/models/data/cipher.data";
import { Folder } from "../../../vault/models/domain/folder";
import { FolderView } from "../../../vault/models/view/folder.view";
import { FolderData } from "../../models/data/folder.data";

import { FolderStateService } from "./folder-state.service";

export class FolderService implements InternalFolderServiceAbstraction {
  protected _folders: BehaviorSubject<Folder[]> = new BehaviorSubject([]);
  protected _folderViews: BehaviorSubject<FolderView[]> = new BehaviorSubject([]);
  private currentUserId: Guid;

  folders$ = this._folders.asObservable();
  folderViews$ = this._folderViews.asObservable();

  constructor(
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private cipherService: CipherService,
    private folderStateService: FolderStateService,
    private stateService: StateService
  ) {
    this.stateService.activeAccountUnlocked$
      .pipe(
        combineLatestWith(this.stateService.activeAccount$),
        concatMap(async ([unlocked, userId]) => {
          if (Utils.global.bitwardenContainerService == null) {
            return;
          }

          if (!unlocked) {
            this._folders.next([]);
            this._folderViews.next([]);
            return;
          }

          this.currentUserId = userId as Guid;
          await this.updateStateFromDisk(this.currentUserId);
        })
      )
      .subscribe();
  }

  async clearCache(): Promise<void> {
    this._folderViews.next([]);
  }

  // TODO: This should be moved to EncryptService or something
  async encrypt(model: FolderView, key?: SymmetricCryptoKey): Promise<Folder> {
    const folder = new Folder();
    folder.id = model.id;
    folder.name = await this.cryptoService.encrypt(model.name, key);
    return folder;
  }

  async get(id: string): Promise<Folder> {
    const folders = this._folders.getValue();

    return folders.find((folder) => folder.id === id);
  }

  async getAllFromState(): Promise<Folder[]> {
    if (!this.currentUserId) {
      return null;
    }

    const stored = await this.folderStateService.getFolders(this.currentUserId);
    return Object.values(stored);
  }

  /**
   * @deprecated For the CLI only
   * @param id id of the folder
   */
  async getFromState(id: Guid): Promise<Folder> {
    if (!this.currentUserId) {
      return null;
    }

    return (await this.folderStateService.getFolders(this.currentUserId))[id];
  }

  /**
   * @deprecated Only use in CLI!
   */
  async getAllDecryptedFromState(): Promise<FolderView[]> {
    if (!this.currentUserId) {
      return null;
    }
    const stored = await this.folderStateService.getFolders(this.currentUserId);

    return await this.decryptFolders(Object.values(stored));
  }

  async upsert(data: FolderData): Promise<void> {
    if (!this.currentUserId) {
      return;
    }

    const allData = await this.folderStateService.getFolderData(this.currentUserId);
    allData[data.id as Guid] = data;

    await this.updateState({ userId: this.currentUserId, data: allData });
  }

  async replace(data: Record<Guid, FolderData>): Promise<void> {
    await this.updateState({ userId: this.currentUserId, data });
  }

  async clear(userId?: Guid): Promise<any> {
    if (userId == null || userId == this.currentUserId) {
      userId = this.currentUserId;
      this._folders.next([]);
      this._folderViews.next([]);
    }
    await this.folderStateService.removeFolders(userId);
  }

  async delete(folderId: string): Promise<any> {
    const data = await this.folderStateService.getFolderData(this.currentUserId);
    if (data == null) {
      return;
    }

    delete data[folderId as Guid];

    await this.updateState({ userId: this.currentUserId, data });

    // Items in a deleted folder are re-assigned to "No Folder"
    const ciphers = await this.stateService.getEncryptedCiphers();
    if (ciphers != null) {
      const updates: CipherData[] = [];
      for (const cId in ciphers) {
        if (ciphers[cId].folderId === folderId) {
          ciphers[cId].folderId = null;
          updates.push(ciphers[cId]);
        }
      }
      if (updates.length > 0) {
        this.cipherService.upsert(updates);
      }
    }
  }

  private async updateStateFromDisk(userId: Guid) {
    const data = await this.folderStateService.getFolderData(userId);
    await this.updateState({ userId, data, updateDisk: false });
  }

  private async updateState({
    userId,
    data,
    updateDisk = true,
  }: {
    userId: Guid;
    data: Record<Guid, FolderData>;
    updateDisk?: boolean;
  }) {
    const folders = Object.values(data).map((f) => new Folder(f));
    this._folders.next(folders);
    if (updateDisk) {
      await this.folderStateService.setFolders(userId, data);
    }

    if (await this.cryptoService.hasKey()) {
      const decrypted = await this.decryptFolders(folders);
      this._folderViews.next(decrypted);
    }
  }

  private async decryptFolders(folders: Folder[]) {
    const decryptFolderPromises = folders.map((f) => f.decrypt());
    const decryptedFolders = await Promise.all(decryptFolderPromises);

    decryptedFolders.sort(Utils.getSortFunction(this.i18nService, "name"));

    const noneFolder = new FolderView();
    noneFolder.name = this.i18nService.t("noneFolder");
    decryptedFolders.push(noneFolder);

    return decryptedFolders;
  }
}
