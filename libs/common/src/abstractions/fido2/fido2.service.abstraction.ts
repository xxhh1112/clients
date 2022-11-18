export interface CredentialRegistrationParams {
  rp: {
    id?: string;
  };
}

export abstract class Fido2Service {
  createCredential: (params: CredentialRegistrationParams) => unknown;
  assertCredential: () => unknown;
}
