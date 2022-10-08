import { Jsonify } from "type-fest";

import { CryptoService } from "../../abstractions/crypto.service";
import Domain from "../domain/domainBase";
import { Folder } from "../domain/folder";
import { SymmetricCryptoKey } from "../domain/symmetricCryptoKey";
import { ITreeNodeObject } from "../domain/treeNode";

import { View } from "./view";

export type DecryptableDecryptType<T, D> = {
  decrypt(cryptoService: CryptoService, key: SymmetricCryptoKey, model: D): T;
};

export abstract class DecryptableView extends View {
  static decrypt: <T extends DecryptableView, D extends Domain>(
    cryptoService: CryptoService,
    key: SymmetricCryptoKey,
    model: D
  ) => Promise<T>;
}

export class FolderView implements DecryptableView, ITreeNodeObject {
  id: string = null;
  name: string = null;
  revisionDate: Date = null;

  constructor(f?: Folder) {
    if (!f) {
      return;
    }

    this.id = f.id;
    this.revisionDate = f.revisionDate;
  }

  static async decrypt(cryptoService: CryptoService, key: SymmetricCryptoKey, model: Folder) {
    const view = new FolderView(model);
    view.name = await cryptoService.decryptToUtf8(model.name, key);
    return view;
  }

  static fromJSON(obj: Jsonify<FolderView>) {
    const revisionDate = obj.revisionDate == null ? null : new Date(obj.revisionDate);
    return Object.assign(new FolderView(), obj, { revisionDate });
  }
}
