import { Directive, HostBinding, Input } from "@angular/core";

import { ButtonLikeAbstraction } from "../shared/button-like.abstraction";

import { PrefixClasses } from "./prefix.directive";

@Directive({
  selector: "[bitSuffix]",
})
export class BitSuffixDirective {
  constructor(private buttonComponent: ButtonLikeAbstraction) {}

  @HostBinding("class") @Input() get classList() {
    return PrefixClasses.concat(["tw-border-l-0", "last:tw-rounded-r"]);
  }

  ngOnInit(): void {
    this.buttonComponent.setButtonType("secondary");
  }
}
