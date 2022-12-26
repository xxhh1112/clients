import { style, animate, trigger, transition } from "@angular/animations";
import { Component, Input } from "@angular/core";

@Component({
  selector: "bit-reveal",
  templateUrl: "./reveal.component.html",
  animations: [
    trigger("reveal", [
      transition(":enter", [
        style({ "grid-template-rows": "0fr" }),
        animate("400ms ease-in-out", style({ "grid-template-rows": "1fr" })),
      ]),
      transition(":leave", [
        style({ "grid-template-rows": "1fr" }),
        animate("400ms ease-in-out", style({ "grid-template-rows": "0fr" })),
      ]),
    ]),
  ],
})
export class BitRevealComponent {
  @Input()
  open = false;
}

/**
 * TODO: add inert when closed: https://github.com/WICG/inert
 */
