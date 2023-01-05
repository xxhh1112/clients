export interface NewCredentialParams {
  name: string;
}

export abstract class Fido2UserInterfaceService {
  pickCredential: (cipherIds: string[]) => Promise<string>;
  confirmNewCredential: (params: NewCredentialParams) => Promise<boolean>;
}
