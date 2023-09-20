import { Component, HostBinding, HostListener, Input, Optional, Self } from "@angular/core";
import { NgControl, Validators } from "@angular/forms";

import { BitFormControlAbstraction } from "../form-control";

@Component({
  selector: "input[type=checkbox][bitCheckbox]",
  template: "",
  providers: [{ provide: BitFormControlAbstraction, useExisting: CheckboxComponent }],
})
export class CheckboxComponent implements BitFormControlAbstraction {
  @HostBinding("class")
  protected inputClasses = [
    "tw-appearance-none",
    "tw-outline-none",
    "tw-relative",
    "tw-transition",
    "tw-cursor-pointer",
    "tw-inline-block",
    "tw-rounded",
    "tw-border",
    "tw-border-solid",
    "tw-border-secondary-500",
    "tw-h-3.5",
    "tw-w-3.5",
    "tw-mr-1.5",
    "tw-bottom-[-1px]", // Fix checkbox looking off-center

    "before:tw-content-['']",
    "before:tw-block",
    "before:tw-absolute",
    "before:tw-inset-0",

    "hover:tw-border-2",
    "[&>label]:tw-border-2",

    "focus-visible:tw-ring-2",
    "focus-visible:tw-ring-offset-2",
    "focus-visible:tw-ring-primary-700",

    "disabled:tw-cursor-auto",
    "disabled:tw-border",
    "disabled:tw-bg-secondary-100",

    "[&:is(:checked,:indeterminate)]:tw-bg-primary-500",
    "[&:is(:checked,:indeterminate)]:tw-border-primary-500",

    "[&:is(:checked,:indeterminate)]:hover:tw-bg-primary-700",
    "[&:is(:checked,:indeterminate)]:hover:tw-border-primary-700",
    "[&>label:hover]:[&:is(:checked,:indeterminate)]:tw-bg-primary-700",
    "[&>label:hover]:[&:is(:checked,:indeterminate)]:tw-border-primary-700",

    "[&:is(:checked,:indeterminate)]:before:tw-bg-text-contrast",
    "[&:is(:checked,:indeterminate)]:before:tw-mask-position-[center]",
    "[&:is(:checked,:indeterminate)]:before:tw-mask-repeat-[no-repeat]",

    "[&:is(:checked):not(:indeterminate)]:before:tw-mask-image-[var(--mask-image)]",
    "indeterminate:before:tw-mask-image-[var(--indeterminate-mask-image)]",

    "[&:is(:checked,:indeterminate)]:disabled:tw-border-secondary-100",
    "[&:is(:checked,:indeterminate)]:disabled:tw-bg-secondary-100",

    "[&:is(:checked,:indeterminate)]:disabled:before:tw-bg-text-muted",
  ];

  constructor(@Optional() @Self() private ngControl?: NgControl) {}

  @HostBinding("style.--mask-image")
  protected maskImage = `url('data:image/svg+xml,%3Csvg class="svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="8" height="8" viewBox="0 0 10 10"%3E%3Cpath d="M0.5 6.2L2.9 8.6L9.5 1.4" fill="none" stroke="white" stroke-width="2"%3E%3C/path%3E%3C/svg%3E')`;

  @HostBinding("style.--indeterminate-mask-image")
  protected indeterminateImage = `url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 13 13"%3E%3Cpath stroke="%23fff" stroke-width="2" d="M2.5 6.5h8"/%3E%3C/svg%3E%0A')`;

  @HostBinding()
  @Input()
  indeterminate: boolean;

  @HostListener("click")
  protected handleClick() {
    this.indeterminate = false;
  }

  @HostBinding()
  @Input()
  get disabled() {
    return this._disabled ?? this.ngControl?.disabled ?? false;
  }
  set disabled(value: any) {
    this._disabled = value != null && value !== false;
  }
  private _disabled: boolean;

  @Input()
  get required() {
    return (
      this._required ?? this.ngControl?.control?.hasValidator(Validators.requiredTrue) ?? false
    );
  }
  set required(value: any) {
    this._required = value != null && value !== false;
  }
  private _required: boolean;

  get hasError() {
    return this.ngControl?.status === "INVALID" && this.ngControl?.touched;
  }

  get error(): [string, any] {
    const key = Object.keys(this.ngControl.errors)[0];
    return [key, this.ngControl.errors[key]];
  }
}
