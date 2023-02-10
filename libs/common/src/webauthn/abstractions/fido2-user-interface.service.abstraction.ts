export interface NewCredentialParams {
  credentialName: string;
  userName: string;
}

export abstract class Fido2UserInterfaceService {
  confirmCredential: (cipherId: string, abortController?: AbortController) => Promise<boolean>;
  pickCredential: (cipherIds: string[], abortController?: AbortController) => Promise<string>;
  confirmNewCredential: (
    params: NewCredentialParams,
    abortController?: AbortController
  ) => Promise<boolean>;
}
