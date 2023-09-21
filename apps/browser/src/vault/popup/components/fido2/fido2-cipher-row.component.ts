import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from "@angular/core";

import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

@Component({
  selector: "app-fido2-cipher-row",
  templateUrl: "fido2-cipher-row.component.html",
})
export class Fido2CipherRowComponent implements OnChanges {
  @ViewChild("cipherRow") cipherRow: ElementRef;
  @Output() onSelected = new EventEmitter<CipherView>();
  @Input() cipher: CipherView;
  @Input() last: boolean;
  @Input() title: string;
  @Input() isSearching: boolean;
  @Input() selectedCipher: CipherView;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.cipher.id === this.selectedCipher.id && !this.isSearching) {
      setTimeout(() => {
        this.cipherRow.nativeElement.classList.add("row-selected");
      });
    } else {
      setTimeout(() => {
        this.cipherRow.nativeElement.classList.remove("row-selected");
      });
    }
  }

  selectCipher(c: CipherView) {
    this.onSelected.emit(c);
  }
}
