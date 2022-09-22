// import { createDevice } from "soft-u2f";

import { U2FDevice } from "./u2f";

// const KEY = `-----BEGIN EC PRIVATE KEY-----
// MHcCAQEEIJnnN7KukWHPKQQDyhLqZTQZhiikCLpCHUkVMauwLxM7oAoGCCqGSM49
// AwEHoUQDQgAEovdy/6v1tXl9sPcY/myjz08O/pQPytwSRjvNfEcHuYg4toCc7KJN
// PP2qAliy/sBsiHlAzxttIdI2DcW0oCi0og==
// -----END EC PRIVATE KEY-----`;

const device = new U2FDevice();

// const d = createDevice();

export async function createCredential(
  options: CredentialCreationOptions
): Promise<PublicKeyCredential> {
  // const result = await device.register("", "", "", "");
  // console.log("device", device);
  const registration = await device.register(
    options.publicKey.rp.id,
    options.publicKey.challenge,
    "https://demo.yubico.com",
    options.publicKey.user.id
  );
  console.log("registration", registration);

  return registration;
  throw new Error("not implemented");
}

export async function getCredential() {
  throw new Error("not implemented");
}
