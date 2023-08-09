import { BitSubject } from "@bitwarden/common/platform/misc/bit-subject";
import { DeepJsonify } from "@bitwarden/common/types/deep-jsonify";

export class BrowserBitSubject<T = never> extends BitSubject<T> {
  constructor(
    private serviceObservableName: string,
    protected initializer: (json: DeepJsonify<T>) => T
  ) {
    super();
  }

  protected get fromBackgroundMessageName(): string {
    return `${this.serviceObservableName}_from_background`;
  }

  protected get fromForegroundMessageName(): string {
    return `${this.serviceObservableName}_from_foreground`;
  }

  protected get requestInitMessageName(): string {
    return `${this.serviceObservableName}_request_init`;
  }

  protected initializeData(json: string) {
    return this.initializer(JSON.parse(json));
  }
}
