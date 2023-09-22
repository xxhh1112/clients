import { Component } from "@angular/core";

import { Cipher } from "@bitwarden/common/vault/models/domain/cipher";

import { AddEditComponent as BaseAddEditComponent } from "../../../vault/individual-vault/add-edit.component";

@Component({
  selector: "app-org-vault-add-edit",
  templateUrl: "../../../vault/individual-vault/add-edit.component.html",
})
export class EmergencyAddEditComponent extends BaseAddEditComponent {
  originalCipher: Cipher = null;
  viewOnly = true;
  protected override componentName = "app-org-vault-add-edit";

  async load() {
    this.title = this.i18nService.t("viewItem");
  }

  protected async loadCipher() {
    return Promise.resolve(this.originalCipher);
  }
}
