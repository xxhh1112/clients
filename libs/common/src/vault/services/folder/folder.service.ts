import { BehaviorSubject, concatMap } from "rxjs";
import { NotificationsService } from "../../../abstractions/notifications.service";
import { NotificationType } from "../../../enums";
import { SyncFolderNotification } from "../../../models/response/notification.response";

import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { Utils } from "../../../platform/misc/utils";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { CipherService } from "../../../vault/abstractions/cipher.service";
import { InternalFolderService as InternalFolderServiceAbstraction } from "../../../vault/abstractions/folder/folder.service.abstraction";
import { CipherData } from "../../../vault/models/data/cipher.data";
import { FolderData } from "../../../vault/models/data/folder.data";
import { Folder } from "../../../vault/models/domain/folder";
import { FolderView } from "../../../vault/models/view/folder.view";
import { FolderApiServiceAbstraction } from "../../abstractions/folder/folder-api.service.abstraction";
import { SyncService } from "../../abstractions/sync/sync.service.abstraction";

export class FolderService implements InternalFolderServiceAbstraction {
  protected _folders: BehaviorSubject<Folder[]> = new BehaviorSubject([]);
  protected _folderViews: BehaviorSubject<FolderView[]> = new BehaviorSubject([]);

  folders$ = this._folders.asObservable();
  folderViews$ = this._folderViews.asObservable();

  constructor(
    private cryptoService: CryptoService,
    private i18nService: I18nService,
    private cipherService: CipherService,
    private apiService: FolderApiServiceAbstraction,
    private stateService: StateService,
    private syncService: SyncService,
    private notificationService: NotificationsService
  ) {
    this.stateService.activeAccountUnlocked$
      .pipe(
        concatMap(async (unlocked) => {
          if (Utils.global.bitwardenContainerService == null) {
            return;
          }

          if (!unlocked) {
            this._folders.next([]);
            this._folderViews.next([]);
            return;
          }

          const data = await this.stateService.getEncryptedFolders();

          await this.updateObservables(data);
        })
      )
      .subscribe();

    this.syncService.sync$
      .pipe(
        concatMap(async (response) => {
          const folders: { [id: string]: FolderData } = {};
          response.folders.forEach((f) => {
            folders[f.id] = new FolderData(f);
          });
          return await this.replace(folders);
        })
      )
      .subscribe();

    this.notificationService.notifications$
      .pipe(
        concatMap(async (notification) => {
          switch (notification.type) {
            case NotificationType.SyncFolderCreate:
            case NotificationType.SyncFolderUpdate:
              await this.syncUpsertFolder(
                notification.payload as SyncFolderNotification,
                notification.type === NotificationType.SyncFolderUpdate
              );
              break;
            case NotificationType.SyncFolderDelete:
              await this.syncDeleteFolder(notification.payload as SyncFolderNotification);
              break;
          }
        })
      )
      .subscribe();
  }

  async clearCache(): Promise<void> {
    this._folderViews.next([]);
  }

  async save(folder: Folder): Promise<any> {
    const response = await this.apiService.save(folder);
    await this.upsert(response);
  }

  async delete(id: string): Promise<any> {
    await this.apiService.delete(id);
    await this.deleteFromState(id);
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
    const folders = await this.stateService.getEncryptedFolders();
    const response: Folder[] = [];
    for (const id in folders) {
      // eslint-disable-next-line
      if (folders.hasOwnProperty(id)) {
        response.push(new Folder(folders[id]));
      }
    }
    return response;
  }

  /**
   * @deprecated For the CLI only
   * @param id id of the folder
   */
  async getFromState(id: string): Promise<Folder> {
    const foldersMap = await this.stateService.getEncryptedFolders();
    const folder = foldersMap[id];
    if (folder == null) {
      return null;
    }

    return new Folder(folder);
  }

  /**
   * @deprecated Only use in CLI!
   */
  async getAllDecryptedFromState(): Promise<FolderView[]> {
    const data = await this.stateService.getEncryptedFolders();
    const folders = Object.values(data || {}).map((f) => new Folder(f));

    return this.decryptFolders(folders);
  }

  async upsert(folder: FolderData | FolderData[]): Promise<void> {
    let folders = await this.stateService.getEncryptedFolders();
    if (folders == null) {
      folders = {};
    }

    if (folder instanceof FolderData) {
      const f = folder as FolderData;
      folders[f.id] = f;
    } else {
      (folder as FolderData[]).forEach((f) => {
        folders[f.id] = f;
      });
    }

    await this.updateObservables(folders);
    await this.stateService.setEncryptedFolders(folders);
  }

  async replace(folders: { [id: string]: FolderData }): Promise<void> {
    await this.updateObservables(folders);
    await this.stateService.setEncryptedFolders(folders);
  }

  async clear(userId?: string): Promise<any> {
    if (userId == null || userId == (await this.stateService.getUserId())) {
      this._folders.next([]);
      this._folderViews.next([]);
    }
    await this.stateService.setEncryptedFolders(null, { userId: userId });
  }

  async deleteFromState(id: string | string[]): Promise<any> {
    const folders = await this.stateService.getEncryptedFolders();
    if (folders == null) {
      return;
    }

    if (typeof id === "string") {
      if (folders[id] == null) {
        return;
      }
      delete folders[id];
    } else {
      (id as string[]).forEach((i) => {
        delete folders[i];
      });
    }

    await this.updateObservables(folders);
    await this.stateService.setEncryptedFolders(folders);

    // Items in a deleted folder are re-assigned to "No Folder"
    const ciphers = await this.stateService.getEncryptedCiphers();
    if (ciphers != null) {
      const updates: CipherData[] = [];
      for (const cId in ciphers) {
        if (ciphers[cId].folderId === id) {
          ciphers[cId].folderId = null;
          updates.push(ciphers[cId]);
        }
      }
      if (updates.length > 0) {
        this.cipherService.upsert(updates);
      }
    }
  }

  private async updateObservables(foldersMap: { [id: string]: FolderData }) {
    const folders = Object.values(foldersMap || {}).map((f) => new Folder(f));

    this._folders.next(folders);

    if (await this.cryptoService.hasUserKey()) {
      this._folderViews.next(await this.decryptFolders(folders));
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

  private async syncDeleteFolder(notification: SyncFolderNotification): Promise<boolean> {
    // this.syncStarted();
    if (await this.stateService.getIsAuthenticated()) {
      await this.deleteFromState(notification.id);
      // this.messagingService.send("syncedDeletedFolder", { folderId: notification.id });
      // this.syncCompleted(true);
      return true;
    }
    // return this.syncCompleted(false);
  }

  private async syncUpsertFolder(
    notification: SyncFolderNotification,
    isEdit: boolean
  ): Promise<boolean> {
    if (await this.stateService.getIsAuthenticated()) {
      try {
        const localFolder = await this.get(notification.id);
        if (
          (!isEdit && localFolder == null) ||
          (isEdit && localFolder != null && localFolder.revisionDate < notification.revisionDate)
        ) {
          const remoteFolder = await this.apiService.get(notification.id);
          if (remoteFolder != null) {
            await this.upsert(new FolderData(remoteFolder));
            // this.messagingService.send("syncedUpsertedFolder", { folderId: notification.id });
            // return this.syncCompleted(true);
          }
        }
      } catch (e) {
        // this.logService.error(e);
      }
    }
    return true;
    // return this.syncCompleted(false);
  }
}
