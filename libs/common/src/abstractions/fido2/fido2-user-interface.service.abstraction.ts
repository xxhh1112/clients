export interface NewCredentialParams {
  credentialName: string;
  userName: string;
}

export abstract class Fido2UserInterfaceService {
  confirmCredential: (cipherId: string) => Promise<boolean>;
  pickCredential: (cipherIds: string[]) => Promise<string>;
  confirmNewCredential: (params: NewCredentialParams) => Promise<boolean>;
}
