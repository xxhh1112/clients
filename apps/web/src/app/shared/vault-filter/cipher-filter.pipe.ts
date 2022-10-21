import { Pipe, PipeTransform } from "@angular/core";

import { CipherView } from "@bitwarden/common/models/view/cipher.view";

import { NewVaultFilterModel } from "./vault-filter.model";

@Pipe({
  name: "cipherFilter",
})
export class CipherFilterPipe implements PipeTransform {
  transform(ciphers: CipherView[], ...[filter]: [NewVaultFilterModel]) {
    if (filter.collectionId) {
      return ciphers.filter((c) => c.collectionIds.includes(filter.collectionId));
    }

    return ciphers;
  }
}
