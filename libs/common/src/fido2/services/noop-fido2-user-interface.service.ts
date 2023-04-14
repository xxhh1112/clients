import { RequestAbortedError } from "../abstractions/fido2-client.service.abstraction";
import {
  Fido2UserInterfaceService as Fido2UserInterfaceServiceAbstraction,
  NewCredentialParams,
} from "../abstractions/fido2-user-interface.service.abstraction";

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

  async confirmNewNonDiscoverableCredential(
    params: NewCredentialParams,
    abortController?: AbortController
  ): Promise<string> {
    return null;
  }

  async informExcludedCredential(
    existingCipherIds: string[],
    newCredential: NewCredentialParams,
    abortController?: AbortController
  ): Promise<void> {
    // Not Implemented
  }
}
