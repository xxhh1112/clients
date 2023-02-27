import { EncryptService } from "@bitwarden/common/abstractions/encrypt.service";
import { Encryptable, KeyRetrieval } from "@bitwarden/common/interfaces/crypto.interface";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetric-crypto-key";

import { Project } from "../project";

export class ProjectView implements Encryptable<Project>, KeyRetrieval {
  id: string;
  organizationId: string;
  name: string;
  creationDate: Date;
  revisionDate: Date;

  static async decrypt(
    encryptService: EncryptService,
    key: SymmetricCryptoKey,
    model: Project
  ): Promise<ProjectView> {
    const view = new ProjectView();

    view.id = model.id;
    view.organizationId = model.organizationId;
    view.name = await encryptService.decryptToUtf8(model.name, key);
    view.creationDate = model.creationDate;
    view.revisionDate = model.revisionDate;

    return view;
  }

  keyIdentifier(): string {
    return this.organizationId;
  }

  async encrypt(encryptService: EncryptService, key: SymmetricCryptoKey): Promise<Project> {
    const model = new Project();

    model.id = this.id;
    model.organizationId = this.organizationId;
    model.name = await encryptService.encrypt(this.name, key);
    model.creationDate = this.creationDate;
    model.revisionDate = this.revisionDate;

    return model;
  }
}
