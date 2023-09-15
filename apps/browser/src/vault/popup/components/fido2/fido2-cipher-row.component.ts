import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";

import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

@Component({
  selector: "app-fido2-cipher-row",
  templateUrl: "fido2-cipher-row.component.html",
})
export class Fido2CipherRowComponent implements AfterViewInit {
  @ViewChild("buttonRow") cipherRow: ElementRef;

  @Output() onSelected = new EventEmitter<CipherView>();
  @Input() cipher: CipherView;
  @Input() last: boolean;
  @Input() title: string;
  @Input() rowIndex: number;

  selectCipher(c: CipherView) {
    this.onSelected.emit(c);
  }

  ngAfterViewInit(): void {
    if (this.cipherRow.nativeElement.id === "fido2CipherRow-0") {
      this.cipherRow.nativeElement.focus();
    }
  }
}
