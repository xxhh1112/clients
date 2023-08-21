import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { SharedModule } from "../../shared";

@Component({
  selector: "app-send-access-password",
  templateUrl: "send-access-password.component.html",
  imports: [SharedModule],
  standalone: true,
})
export class SendAccessPasswordComponent {
  formGroup = this.formBuilder.group({
    password: ["", [Validators.required]],
  });

  @Input() loading: boolean;
  @Output() setPasswordEvent = new EventEmitter<string>();

  constructor(private formBuilder: FormBuilder) {}

  setPassword(value: string) {
    this.setPasswordEvent.emit(value);
  }
}
