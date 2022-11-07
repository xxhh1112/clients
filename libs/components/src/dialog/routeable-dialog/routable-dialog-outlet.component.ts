import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

export const DialogOutlet = "dialog";

@Component({
  selector: "bit-routeable-dialog-outlet",
  // template: ``,
  template: `<router-outlet name="dialog"></router-outlet>`,
})
export class RouteableDialogOutlet {
  constructor(activatedRoute: ActivatedRoute) {
    console.log({ activatedRoute });
  }
}
