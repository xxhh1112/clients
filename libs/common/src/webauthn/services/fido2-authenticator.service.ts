import {
  Fido2AuthenticatorMakeCredentialsParams,
  Fido2AuthenticatorService as Fido2AuthenticatorServiceAbstraction,
} from "../abstractions/fido2-authenticator.service.abstraction";

/**
 * Bitwarden implementation of the Authenticator API described by the FIDO Alliance
 * https://fidoalliance.org/specs/fido-v2.0-ps-20190130/fido-client-to-authenticator-protocol-v2.0-ps-20190130.html
 */
export class Fido2AuthenticatorService implements Fido2AuthenticatorServiceAbstraction {
  makeCredential: (params: Fido2AuthenticatorMakeCredentialsParams) => void;
}
