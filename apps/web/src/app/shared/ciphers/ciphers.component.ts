import { Component, Input } from "@angular/core";

import { CipherView } from "@bitwarden/common/models/view/cipher.view";

@Component({
  selector: "app-new-ciphers",
  templateUrl: "./ciphers.component.html",
})
export class CiphersComponent {
  @Input()
  ciphers: CipherView[] = [];
}
