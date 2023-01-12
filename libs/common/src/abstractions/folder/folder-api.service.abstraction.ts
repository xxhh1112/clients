import { FolderResponse } from "../../models/response/folder.response";
import { FolderView } from "../../models/view/folder.view";

export class FolderApiServiceAbstraction {
  save: (folder: FolderView) => Promise<any>;
  delete: (id: string) => Promise<any>;
  get: (id: string) => Promise<FolderResponse>;
}
