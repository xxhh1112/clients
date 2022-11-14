import { Directive, Input, OnDestroy, OnInit } from "@angular/core";
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  ValidationErrors,
  Validator,
} from "@angular/forms";
import { Observable, map, Subject, takeUntil } from "rxjs";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PolicyService } from "@bitwarden/common/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/enums/policyType";
import { Policy } from "@bitwarden/common/models/domain/policy";

@Directive()
export class VaultTimeoutInputComponent
  implements ControlValueAccessor, Validator, OnInit, OnDestroy
{
  get showCustom() {
    return this.form.get("vaultTimeout").value === VaultTimeoutInputComponent.CUSTOM_VALUE;
  }

  get exceedsMinimumTimout(): boolean {
    return (
      !this.showCustom || this.customTimeInMinutes() > VaultTimeoutInputComponent.MIN_CUSTOM_MINUTES
    );
  }

  static CUSTOM_VALUE = -100;
  static MIN_CUSTOM_MINUTES = 0;

  form = this.formBuilder.group({
    vaultTimeout: [null],
    custom: this.formBuilder.group({
      hours: [null],
      minutes: [null],
    }),
  });

  @Input() vaultTimeouts: { name: string; value: number }[];
  vaultTimeoutPolicy$: Observable<Policy>;
  vaultTimeoutPolicyHours: number;
  vaultTimeoutPolicyMinutes: number;

  private onChange: (vaultTimeout: number) => void;
  private validatorChange: () => void;
  protected destroy$ = new Subject<null>();

  constructor(
    private formBuilder: FormBuilder,
    private policyService: PolicyService,
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService
  ) {}

  async ngOnInit() {
    this.vaultTimeoutPolicy$ = this.policyService.policies$.pipe(
      map((policies) => policies.find((p) => p.type === PolicyType.MaximumVaultTimeout))
    );

    const sub = this.vaultTimeoutPolicy$.pipe(takeUntil(this.destroy$)).subscribe();

    sub.unsubscribe();
    alert("unsubscribed");

    // this.vaultTimeoutPolicy$
    //   .pipe(
    //     withLatestFrom(
    //       this.policyService.policyAppliesToActiveUser$(PolicyType.MaximumVaultTimeout)
    //     ),
    //     takeUntil(this.destroy$)
    //   )
    //   .subscribe(([policy, applies]) => {
    //     if (applies) {
    //       this.applyVaultTimeoutPolicy(policy);
    //     }
    //   });

    // eslint-disable-next-line rxjs/no-async-subscribe
    this.form.valueChanges.subscribe(async (value) => {
      this.onChange(this.getVaultTimeout(value));
    });

    // Assign the previous value to the custom fields
    this.form.get("vaultTimeout").valueChanges.subscribe((value) => {
      if (value !== VaultTimeoutInputComponent.CUSTOM_VALUE) {
        return;
      }

      const current = Math.max(this.form.value.vaultTimeout, 0);
      this.form.patchValue({
        custom: {
          hours: Math.floor(current / 60),
          minutes: current % 60,
        },
      });
    });
  }

  ngOnDestroy() {
    // console.log("Entered destroyed vault timeout input component");
    alert("Entered destroyed vault timeout input component");
    this.destroy$.next(null);
    this.destroy$.complete();
    alert("destroyed vault timeout input component");
  }

  ngOnChanges() {
    this.vaultTimeouts.push({
      name: this.i18nService.t("custom"),
      value: VaultTimeoutInputComponent.CUSTOM_VALUE,
    });
  }

  getVaultTimeout(value: any) {
    if (value.vaultTimeout !== VaultTimeoutInputComponent.CUSTOM_VALUE) {
      return value.vaultTimeout;
    }

    return value.custom.hours * 60 + value.custom.minutes;
  }

  writeValue(value: number): void {
    if (value == null) {
      return;
    }

    if (this.vaultTimeouts.every((p) => p.value !== value)) {
      this.form.setValue({
        vaultTimeout: VaultTimeoutInputComponent.CUSTOM_VALUE,
        custom: {
          hours: Math.floor(value / 60),
          minutes: value % 60,
        },
      });
      return;
    }

    this.form.patchValue({
      vaultTimeout: value,
    });
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    // Empty
  }

  setDisabledState?(isDisabled: boolean): void {
    // Empty
  }

  validate(control: AbstractControl): Observable<ValidationErrors> {
    return this.vaultTimeoutPolicy$.pipe(
      map((policy) => {
        if (policy && policy?.data?.minutes < control.value) {
          return { policyError: true };
        }

        if (!this.exceedsMinimumTimout) {
          return { minTimeoutError: true };
        }

        return null;
      })
    );
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange = fn;
  }

  private customTimeInMinutes() {
    return this.form.value.custom.hours * 60 + this.form.value.custom.minutes;
  }

  private applyVaultTimeoutPolicy(vaultTimeoutPolicy: Policy) {
    if (vaultTimeoutPolicy == null) {
      return;
    }

    this.vaultTimeoutPolicyHours = Math.floor(vaultTimeoutPolicy.data.minutes / 60);
    this.vaultTimeoutPolicyMinutes = vaultTimeoutPolicy.data.minutes % 60;

    this.vaultTimeouts = this.vaultTimeouts.filter(
      (t) =>
        t.value <= vaultTimeoutPolicy.data.minutes &&
        (t.value > 0 || t.value === VaultTimeoutInputComponent.CUSTOM_VALUE) &&
        t.value != null
    );
    this.validatorChange();
  }
}
