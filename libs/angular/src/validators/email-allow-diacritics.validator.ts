import * as punycode from "punycode";

import { AbstractControl, ValidationErrors } from "@angular/forms";

/**
 * Validator based on the Validators.Email (https://github.com/angular/angular/blob/4dcbb6aef9ec6d1f1fe9a926d0b40c72139a013b/packages/forms/src/validators.ts#L493).
 * Using a custom Regexp and converting to unicode the email value before validating it
 */
export function EmailAllowingDiacritics(control: AbstractControl): ValidationErrors | null {
  // Adaptation from Angular EmailValidator regex (https://github.com/angular/angular/blob/4dcbb6aef9ec6d1f1fe9a926d0b40c72139a013b/packages/forms/src/validators.ts#L127)
  // to allow diacritics and match the server side unit tests
  /* eslint-disable-next-line no-var */
  var regexpEmail =
    /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[\p{L}.!#$%&'*+/=?^_`{|}~-](?:[\p{L}.!#$%&'*+/=?^_`{|}~-]{0,61})?\.(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}\p{L})?)+$/u;

  if (
    control.value == null ||
    ((typeof control.value === "string" || Array.isArray(control.value)) &&
      control.value.length === 0)
  ) {
    return null; // don't validate empty values to allow optional controls
  }
  return regexpEmail.test(punycode.toUnicode(control.value)) ? null : { email: true };
}
