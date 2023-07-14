import {
  Directive,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnInit,
  Optional,
  Output,
  Provider,
} from "@angular/core";
import { combineLatest } from "rxjs";

import { ButtonLikeAbstraction } from "../shared/button-like.abstraction";
import { FunctionReturningAwaitable } from "../utils/function-to-observable";

import { AsyncContextService } from "./async-context.service";
import { BitAsyncTag, BitAsyncTaggedEvent } from "./bit-async-tag";

const BIT_ASYNC_CLICK_CONFIG = "BIT_ASYNC_CLICK_CONFIG";
export interface BitAsyncClickConfig {
  stopPropagation?: boolean;
}
export function BitAsyncClickConfig(config: BitAsyncClickConfig): Provider {
  return { provide: BIT_ASYNC_CLICK_CONFIG, useValue: config };
}

@Directive({
  selector: "[bitAsyncClick], (bitAsyncClick)",
})
export class BitAsyncClickDirective implements OnInit {
  private tag = new BitAsyncTag();

  @Input("bitAsyncClick") protected handler: FunctionReturningAwaitable;
  @Output("bitAsyncClick") protected output = new EventEmitter<BitAsyncTaggedEvent<MouseEvent>>();

  constructor(
    private asyncContext: AsyncContextService,
    private buttonComponent: ButtonLikeAbstraction,
    @Optional() @Inject(BIT_ASYNC_CLICK_CONFIG) private config?: BitAsyncClickConfig
  ) {}

  ngOnInit(): void {
    combineLatest({
      loading: this.asyncContext.loading$,
      currentAction: this.asyncContext.currentAction$,
    }).subscribe(({ loading, currentAction }) => {
      if (loading && currentAction?.tag === this.tag) {
        this.buttonComponent.loading = loading;
      } else {
        this.buttonComponent.loading = false;
        this.buttonComponent.disabled = loading;
      }
    });
  }

  @HostListener("click", ["$event"])
  protected async onClick($event: MouseEvent) {
    if (this.config?.stopPropagation) {
      $event.stopPropagation();
    }

    if (this.buttonComponent.disabled) {
      return;
    }

    if (this.handler) {
      this.asyncContext.execute(this.tag, this.handler);
    }

    this.output.emit(new BitAsyncTaggedEvent($event, this.tag));
  }
}
