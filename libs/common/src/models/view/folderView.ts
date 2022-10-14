import { Jsonify } from "type-fest";

import { CryptoService } from "../../abstractions/crypto.service";
import { Folder } from "../domain/folder";
import { SymmetricCryptoKey } from "../domain/symmetricCryptoKey";
import { ITreeNodeObject } from "../domain/treeNode";

export type DecryptViewType<T, D> = {
  decrypt(cryptoService: CryptoService, key: SymmetricCryptoKey, model: D): T;
};

export interface Encryptable<D> {
  encrypt(cryptoService: CryptoService, key: SymmetricCryptoKey): Promise<D>;
}

export class FolderView implements ITreeNodeObject, Encryptable<Folder> {
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

  async encrypt(cryptoService: CryptoService, key: SymmetricCryptoKey): Promise<Folder> {
    const folder = new Folder();
    folder.id = this.id;
    folder.name = await cryptoService.encrypt(this.name, key);
    folder.revisionDate = this.revisionDate;

    return folder;
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
