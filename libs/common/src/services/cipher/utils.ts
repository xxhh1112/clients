import { I18nService } from "../../abstractions/i18n.service";

import { CipherType } from "./../../enums/cipherType";

export class Utils {
  static initiated = false;

  static init() {
    if (Utils.initiated) {
      return;
    }
  }

  static getLocaleSortingFunction(i18nService: I18nService) {
    return (a: any, b: any) => {
      let aName = a.name;
      let bName = b.name;

      if (aName == null && bName != null) {
        return -1;
      }
      if (aName != null && bName == null) {
        return 1;
      }
      if (aName == null && bName == null) {
        return 0;
      }

      const result = i18nService.collator
        ? i18nService.collator.compare(aName, bName)
        : aName.localeCompare(bName);

      if (result !== 0 || a.type !== CipherType.Login || b.type !== CipherType.Login) {
        return result;
      }

      if (a.login.username != null) {
        aName += a.login.username;
      }

      if (b.login.username != null) {
        bName += b.login.username;
      }

      return i18nService.collator
        ? i18nService.collator.compare(aName, bName)
        : aName.localeCompare(bName);
    };
  }
}
