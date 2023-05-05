import { Directive, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";

// TODO: clean up these comments
// Existing patterns for cross client components:
// 1. Create a new base component here in libs/angular
// 2. for each client, create a new component that extends the base component with its own client specific logic

@Directive()
export class BaseLoginDecryptionOptionsComponent implements OnInit {
  rememberDeviceForm = this.formBuilder.group({
    rememberDevice: [true],
  });

  constructor(protected formBuilder: FormBuilder) {}

  ngOnInit() {
    //
  }
}
