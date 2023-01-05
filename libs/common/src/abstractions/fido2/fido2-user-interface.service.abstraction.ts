export interface NewCredentialParams {
  name: string;
}

export abstract class Fido2UserInterfaceService {
  verifyUser: () => Promise<boolean>;
  verifyPresence: () => Promise<boolean>;
  confirmNewCredential: (params: NewCredentialParams) => Promise<boolean>;
}
