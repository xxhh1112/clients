import { EncryptService } from "@bitwarden/common/abstractions/encrypt.service";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";

import { Secret } from "../secret";

import { SecretProjectView } from "./secret-project.view";

export class SecretListView {
  id: string;
  organizationId: string;
  name: string;
  creationDate: Date;
  revisionDate: Date;

  projects: SecretProjectView[];

  static async decrypt(
    encryptService: EncryptService,
    key: SymmetricCryptoKey,
    model: Secret
  ): Promise<SecretListView> {
    const view = new SecretListView();

    view.id = model.id;
    view.organizationId = model.organizationId;
    view.name = await encryptService.decryptToUtf8(model.name, key);
    view.creationDate = model.creationDate;
    view.revisionDate = model.revisionDate;

    return view;
  }
}
