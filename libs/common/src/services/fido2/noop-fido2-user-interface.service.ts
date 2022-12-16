import { Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction } from "../../abstractions/fido2/fido2-user-interface.service.abstraction";

export class Fido2UserInterfaceService implements Fido2UserInterfaceServiceAbstraction {
  async verifyUser(): Promise<boolean> {
    return false;
  }

  async verifyPresence(): Promise<boolean> {
    return false;
  }

  async confirmNewCredential(): Promise<boolean> {
    return false;
  }
}
