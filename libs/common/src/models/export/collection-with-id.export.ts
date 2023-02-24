import { Collection as CollectionDomain } from "../domain/collection";
import { EncString } from "../domain/enc-string";
import { CollectionView } from "../view/collection.view";

import { CollectionExport } from "./collection.export";

export class CollectionWithIdExport extends CollectionExport {
  id: string;

  static toView(req: CollectionWithIdExport, view = new CollectionView()) {
    view.name = req.name;
    view.externalId = req.externalId;
    view.id = req.id;
    if (view.organizationId == null) {
      view.organizationId = req.organizationId;
    }
    return view;
  }

  static toDomain(req: CollectionWithIdExport, domain = new CollectionDomain()) {
    domain.name = req.name != null ? new EncString(req.name) : null;
    domain.externalId = req.externalId;
    domain.id = req.id;
    if (domain.organizationId == null) {
      domain.organizationId = req.organizationId;
    }
    return domain;
  }

  // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
  build(o: CollectionView | CollectionDomain) {
    this.id = o.id;
    super.build(o);
  }
}
