import { Fido2UserInterfaceService } from "../../abstractions/fido2/fido2-user-interface.service.abstraction";
import {
  CredentialRegistrationParams,
  Fido2Service as Fido2ServiceAbstraction,
} from "../../abstractions/fido2/fido2.service.abstraction";

export class Fido2Service implements Fido2ServiceAbstraction {
  constructor(private fido2UserInterfaceService: Fido2UserInterfaceService) {}

  async createCredential(params: CredentialRegistrationParams): Promise<unknown> {
    await this.fido2UserInterfaceService.confirmNewCredential();
    // eslint-disable-next-line no-console
    console.log("Fido2Service.registerCredential", params);
    return "createCredential response";
  }

  assertCredential(): unknown {
    return undefined;
  }
}
