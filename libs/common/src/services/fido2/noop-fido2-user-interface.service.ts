import { Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction } from "../../abstractions/fido2/fido2-user-interface.service.abstraction";
import { RequestAbortedError } from "../../abstractions/fido2/fido2.service.abstraction";

export class Fido2UserInterfaceService implements Fido2UserInterfaceServiceAbstraction {
  pickCredential(cipherIds: string[]): Promise<string> {
    throw new RequestAbortedError();
  }

  async confirmNewCredential(): Promise<boolean> {
    return false;
  }
}
