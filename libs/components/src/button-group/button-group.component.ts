import { HostBinding, Component, Input } from "@angular/core";

let nextId = 0;

@Component({
  selector: "bit-button-group",
  templateUrl: "./button-group.component.html",
  host: {
    class: "",
  },
})
export class ButtonGroupComponent {
  @Input() name = `bit-button-group-${nextId++}`;

  @HostBinding("class") get classList() {
    return [];
  }
}
