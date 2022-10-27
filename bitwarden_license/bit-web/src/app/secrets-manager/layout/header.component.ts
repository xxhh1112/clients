import { Component, Input } from "@angular/core";

@Component({
  selector: "sm-header",
  templateUrl: "./header.component.html",
})
export class HeaderComponent {
  @Input() title: string;
  @Input() searchTitle: string;
}
