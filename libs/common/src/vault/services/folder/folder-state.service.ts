import { Jsonify } from "type-fest";

import { StateService } from "../../../abstractions/state.service";
import { storageKey } from "../../../misc/storage-key";
import { Utils } from "../../../misc/utils";
import { Guid } from "../../../types/guid";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";

export abstract class FolderStateService {
  /** sets an array of folders to disk
   * @param userId the user id to associate with the folders
   * @param folders Record of folders to store, keyed by folder id
   */
  abstract setFolders(userId: Guid, folders: Record<Guid, FolderData>): Promise<void>;
  /** removes all folders from disk for the given user id
   * @param userId the id of the user to remove folders for
   */
  abstract removeFolders(userId: Guid): Promise<void>;
  /** gets the record for FolderData stored on disk
   * @param userId the id of the user to get folders for
   */
  abstract getFolderData(userId: Guid): Promise<Record<Guid, FolderData>>;
  /** gets the record of FolderData stored on disk and converts it to the Folder Domain model.
   * @param userId the id of the user to get folders for
   * @returns Record of folders for the given user id, keyed by folder id.
   * If none are found in storage, will return an empty array
   */
  abstract getFolders(userId: Guid): Promise<Record<Guid, Folder>>;
}

/** Key used for data persistence. This value should not change without an associated state migration */
const SERVICE_KEY = "folder";
/** Key used for data persistence. This value should not change without an associated state migration */
const FOLDERS_KEY = "folders";

export class FolderStateServiceImplementation implements FolderStateService {
  constructor(private stateService: StateService) {}

  async setFolders(userId: Guid, folders: Record<Guid, FolderData>) {
    if (userId == null || folders == null) {
      throw new Error("userId and folders are required");
    }

    return await this.stateService.set("disk", this.foldersKey(userId), folders);
  }

  async getFolderData(userId: Guid): Promise<Record<Guid, FolderData>> {
    if (userId == null) {
      throw new Error("userId is required");
    }

    return await this.stateService.get<Jsonify<Record<Guid, FolderData>>>(
      "disk",
      this.foldersKey(userId)
    );
  }

  async getFolders(userId: Guid): Promise<Record<Guid, Folder>> {
    const stored = await this.getFolderData(userId);
    const initialized = Object.values(stored ?? {}).map((data) => new Folder(data));

    return Utils.recordByProperty(initialized, "id");
  }

  async removeFolders(userId: Guid) {
    if (userId == null) {
      throw new Error("userId is required");
    }

    return await this.stateService.remove("disk", this.foldersKey(userId));
  }

  private foldersKey(userId: Guid) {
    return storageKey(["account", userId], SERVICE_KEY, FOLDERS_KEY);
  }
}
