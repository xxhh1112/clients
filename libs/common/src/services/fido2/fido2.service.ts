import {
  CredentialRegistrationParams,
  Fido2Service as Fido2ServiceAbstraction,
} from "../../abstractions/fido2/fido2.service.abstraction";

export class Fido2Service implements Fido2ServiceAbstraction {
  createCredential(params: CredentialRegistrationParams): unknown {
    // eslint-disable-next-line no-console
    console.log("Fido2Service.registerCredential");
    return undefined;
  }

  assertCredential(): unknown {
    return undefined;
  }
}
