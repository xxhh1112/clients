import { Directive, HostListener, Input, OnInit } from "@angular/core";
import { combineLatest } from "rxjs";

import { ButtonLikeAbstraction } from "../shared/button-like.abstraction";
import { FunctionReturningAwaitable } from "../utils/function-to-observable";

import { AsyncContextService } from "./async-context.service";

@Directive({
  selector: "[bitAsyncClick]",
})
export class BitAsyncClickDirective implements OnInit {
  @Input("bitAsyncClick") protected handler: FunctionReturningAwaitable;

  constructor(
    private asyncContext: AsyncContextService,
    private buttonComponent: ButtonLikeAbstraction
  ) {}

  ngOnInit(): void {
    combineLatest({
      loading: this.asyncContext.loading$,
      currentAction: this.asyncContext.currentAction$,
    }).subscribe(({ loading, currentAction }) => {
      if (loading && currentAction === this.handler) {
        this.buttonComponent.loading = loading;
      } else {
        this.buttonComponent.loading = false;
        this.buttonComponent.disabled = loading;
      }
    });
  }

  @HostListener("click")
  protected async onClick() {
    if (!this.handler || this.buttonComponent.disabled) {
      return;
    }

    this.asyncContext.run(this.handler);
  }
}
