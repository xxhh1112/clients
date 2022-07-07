import { Component, HostBinding, Input } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

let nextId = 0;

@Component({
  selector: "bit-button-group",
  templateUrl: "./button-group.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ButtonGroupComponent,
      multi: true,
    },
  ],
})
export class ButtonGroupComponent implements ControlValueAccessor {
  private id = nextId++;

  onChange: (value: unknown) => void;

  selected?: unknown;

  @Input() label?: string;
  @Input() name = `bit-button-group-${this.id}`;

  @HostBinding("attr.role") role = "radiogroup";
  @HostBinding("attr.aria-labelledby") labelId = `bit-button-group-label-${this.id}`;

  onInputInteraction(value: unknown) {
    this.selected = value;
    if (this.onChange) {
      this.onChange(value);
    }
  }

  writeValue(obj: any): void {
    this.selected = obj;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    // not supported
  }

  setDisabledState?(isDisabled: boolean): void {
    // not supported
  }
}
