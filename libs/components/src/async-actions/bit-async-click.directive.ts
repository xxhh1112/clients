import { Directive, HostBinding, HostListener, Input, OnInit, Optional } from "@angular/core";
import { combineLatest } from "rxjs";

import { ButtonLikeAbstraction } from "../shared/button-like.abstraction";
import { FunctionReturningAwaitable } from "../utils/function-to-observable";

import { AsyncContextService } from "./async-context.service";

@Directive({
  selector: "[bitAsyncClick]",
})
export class BitAsyncClickDirective implements OnInit {
  private _disabled = false;

  @Input("bitAsyncClick") protected handler: FunctionReturningAwaitable;

  constructor(
    private asyncContext: AsyncContextService,
    @Optional() private buttonComponent: ButtonLikeAbstraction
  ) {}

  ngOnInit(): void {
    combineLatest({
      loading: this.asyncContext.loading$,
      currentAction: this.asyncContext.currentAction$,
    }).subscribe(({ loading, currentAction }) => {
      if (this.buttonComponent == undefined) {
        this._disabled = loading;
        return;
      }

      if (currentAction === this.handler) {
        this.buttonComponent.loading = loading;
      } else {
        this.buttonComponent.disabled = loading;
      }
    });
  }

  @HostBinding("attr.disabled") get disabled() {
    return this._disabled ? true : null;
  }

  @HostListener("click")
  protected async onClick() {
    if (!this.handler || this.buttonComponent.disabled) {
      return;
    }

    this.asyncContext.run(this.handler);
  }
}
