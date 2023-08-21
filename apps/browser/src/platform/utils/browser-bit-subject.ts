import { BitSubject } from "@bitwarden/common/platform/misc/bit-subject";

export class BrowserBitSubject<T = never> extends BitSubject<T> {
  constructor(private serviceObservableName: string) {
    super();
  }

  protected get portName(): string {
    return `${this.serviceObservableName}_port`;
  }
}
