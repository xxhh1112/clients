import { EncryptService } from "@bitwarden/common/abstractions/encrypt.service";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";

import { Secret } from "../secret";

import { SecretProjectView } from "./secret-project.view";

export class SecretView {
  id: string;
  organizationId: string;
  name: string;
  value: string;
  note: string;
  creationDate: Date;
  revisionDate: Date;

  projects: SecretProjectView[];

  static async decrypt(
    encryptService: EncryptService,
    key: SymmetricCryptoKey,
    model: Secret
  ): Promise<SecretView> {
    const view = new SecretView();

    view.id = model.id;
    view.organizationId = model.organizationId;
    view.creationDate = model.creationDate;
    view.revisionDate = model.revisionDate;

    [view.name, view.value, view.note] = await Promise.all([
      encryptService.decryptToUtf8(model.name, key),
      encryptService.decryptToUtf8(model.value, key),
      encryptService.decryptToUtf8(model.note, key),
    ]);

    return view;
  }
}
