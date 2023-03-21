import { Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction } from "../abstractions/fido2-user-interface.service.abstraction";
import { RequestAbortedError } from "../abstractions/fido2.service.abstraction";

export class Fido2UserInterfaceService implements Fido2UserInterfaceServiceAbstraction {
  async confirmCredential(): Promise<boolean> {
    return false;
  }

  pickCredential(): Promise<string> {
    throw new RequestAbortedError();
  }

  async confirmNewCredential(): Promise<boolean> {
    return false;
  }

  async confirmDuplicateCredential() {
    return false;
  }
}
