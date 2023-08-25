import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderResponse } from "../../models/response/folder.response";

export class FolderApiServiceAbstraction {
  save: (folder: Folder) => Promise<FolderData>;
  delete: (id: string) => Promise<any>;
  get: (id: string) => Promise<FolderResponse>;
}
