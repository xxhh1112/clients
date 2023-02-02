import { AbstractControl, ValidationErrors } from "@angular/forms";

import { Utils } from "@bitwarden/common/misc/utils";

// punycode needs to be required here to override built-in node module
// https://github.com/mathiasbynens/punycode.js#installation
// eslint-disable-next-line @typescript-eslint/no-var-requires
const punycode = require("punycode/");

/**
 * Validator based on the Validators.Email (https://github.com/angular/angular/blob/4dcbb6aef9ec6d1f1fe9a926d0b40c72139a013b/packages/forms/src/validators.ts#L493).
 * Using a custom Regexp and converting to unicode the email value before validating it
 */
export function emailAllowingDiacritics(control: AbstractControl): ValidationErrors | null {
  if (
    control.value == null ||
    ((typeof control.value === "string" || Array.isArray(control.value)) &&
      control.value.length === 0)
  ) {
    return null; // don't validate empty values to allow optional controls
  }
  return Utils.regexpEmail.test(punycode.toUnicode(control.value)) ? null : { email: true };
}
