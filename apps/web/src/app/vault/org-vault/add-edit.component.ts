import { Component, inject } from "@angular/core";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CipherData } from "@bitwarden/common/vault/models/data/cipher.data";
import { Cipher } from "@bitwarden/common/vault/models/domain/cipher";

import { AddEditComponent as BaseAddEditComponent } from "../individual-vault/add-edit.component";

@Component({
  selector: "app-org-vault-add-edit",
  templateUrl: "../individual-vault/add-edit.component.html",
})
export class AddEditComponent extends BaseAddEditComponent {
  originalCipher: Cipher = null;
  protected override componentName = "app-org-vault-add-edit";

  protected apiService = inject(ApiService);

  protected allowOwnershipAssignment() {
    if (
      this.ownershipOptions != null &&
      (this.ownershipOptions.length > 1 || !this.allowPersonal)
    ) {
      if (this.organization != null) {
        return this.cloneMode && this.organization.canEditAnyCollection;
      } else {
        return !this.editMode || this.cloneMode;
      }
    }
    return false;
  }

  protected loadCollections() {
    if (!this.organization.canEditAnyCollection) {
      return super.loadCollections();
    }
    return Promise.resolve(this.collections);
  }

  protected async loadCipher() {
    if (!this.organization.canEditAnyCollection) {
      return await super.loadCipher();
    }
    const response = await this.apiService.getCipherAdmin(this.cipherId);
    const data = new CipherData(response);

    data.edit = true;
    const cipher = new Cipher(data);
    this.originalCipher = cipher;
    return cipher;
  }

  protected encryptCipher() {
    if (!this.organization.canEditAnyCollection) {
      return super.encryptCipher();
    }
    return this.cipherService.encrypt(this.cipher, null, this.originalCipher);
  }

  protected async deleteCipher() {
    if (!this.organization.canEditAnyCollection) {
      return super.deleteCipher();
    }
    return this.cipher.isDeleted
      ? this.apiService.deleteCipherAdmin(this.cipherId)
      : this.apiService.putDeleteCipherAdmin(this.cipherId);
  }
}
