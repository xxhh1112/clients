import {
  Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction,
  Fido2UserInterfaceSession,
} from "../../abstractions/fido2/fido2-user-interface.service.abstraction";

export class Fido2UserInterfaceService implements Fido2UserInterfaceServiceAbstraction {
  newSession(
    fallbackSupported: boolean,
    abortController?: AbortController
  ): Promise<Fido2UserInterfaceSession> {
    throw new Error("Not implemented exception");
  }
}
