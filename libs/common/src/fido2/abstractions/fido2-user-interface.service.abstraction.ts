export interface NewCredentialParams {
  credentialName: string;
  userName: string;
}

export abstract class Fido2UserInterfaceService {
  newSession: (abortController?: AbortController) => Promise<Fido2UserInterfaceSession>;
}

export abstract class Fido2UserInterfaceSession {
  fallbackRequested = false;
  aborted = false;

  confirmCredential: (cipherId: string, abortController?: AbortController) => Promise<boolean>;
  pickCredential: (cipherIds: string[], abortController?: AbortController) => Promise<string>;
  confirmNewCredential: (
    params: NewCredentialParams,
    abortController?: AbortController
  ) => Promise<boolean>;
  confirmNewNonDiscoverableCredential: (
    params: NewCredentialParams,
    abortController?: AbortController
  ) => Promise<string | undefined>;
  informExcludedCredential: (
    existingCipherIds: string[],
    abortController?: AbortController
  ) => Promise<void>;
  informCredentialNotFound: (abortController?: AbortController) => Promise<void>;
  close: () => void;
}
