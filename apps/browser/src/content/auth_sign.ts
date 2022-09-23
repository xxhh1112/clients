import { U2FDevice } from "./u2f";

const device = new U2FDevice();

// TODO: this file is a bit redundant, clean up

export async function createCredential(
  options: CredentialCreationOptions,
  origin: string
): Promise<PublicKeyCredential> {
  const registration = await device.register(options, origin);
  return registration;
}

export async function getCredential() {
  throw new Error("not implemented");
}
