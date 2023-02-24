import { Folder as FolderDomain } from "../../vault/models/domain/folder";
import { FolderView } from "../../vault/models/view/folder.view";
import { EncString } from "../domain/enc-string";

import { FolderExport } from "./folder.export";

export class FolderWithIdExport extends FolderExport {
  id: string;

  static toView(req: FolderWithIdExport, view = new FolderView()) {
    view.name = req.name;
    view.id = req.id;
    return view;
  }

  static toDomain(req: FolderWithIdExport, domain = new FolderDomain()) {
    domain.name = req.name != null ? new EncString(req.name) : null;
    domain.id = req.id;
    return domain;
  }

  // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
  build(o: FolderView | FolderDomain) {
    this.id = o.id;
    super.build(o);
  }
}
