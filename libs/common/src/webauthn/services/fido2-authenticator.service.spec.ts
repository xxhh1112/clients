import { TextEncoder } from "util";

import { mock, MockProxy } from "jest-mock-extended";

import { Utils } from "../../misc/utils";
import { CipherService } from "../../vault/abstractions/cipher.service";
import { CipherType } from "../../vault/enums/cipher-type";
import { Cipher } from "../../vault/models/domain/cipher";
import { Login } from "../../vault/models/domain/login";
import { CipherView } from "../../vault/models/view/cipher.view";
import {
  Fido2AutenticatorErrorCode,
  Fido2AuthenticatorMakeCredentialsParams,
} from "../abstractions/fido2-authenticator.service.abstraction";
import {
  Fido2UserInterfaceService,
  NewCredentialParams,
} from "../abstractions/fido2-user-interface.service.abstraction";
import { Fido2Utils } from "../abstractions/fido2-utils";
import { Fido2Key } from "../models/domain/fido2-key";

import { Fido2AuthenticatorService } from "./fido2-authenticator.service";

const RpId = "bitwarden.com";

describe("FidoAuthenticatorService", () => {
  let cipherService!: MockProxy<CipherService>;
  let userInterface!: MockProxy<Fido2UserInterfaceService>;
  let authenticator!: Fido2AuthenticatorService;

  beforeEach(() => {
    cipherService = mock<CipherService>();
    userInterface = mock<Fido2UserInterfaceService>();
    authenticator = new Fido2AuthenticatorService(cipherService, userInterface);
  });

  describe("authenticatorMakeCredential", () => {
    let invalidParams!: InvalidParams;

    beforeEach(async () => {
      invalidParams = await createInvalidParams();
    });

    describe("invalid input parameters", () => {
      // Spec: Check if at least one of the specified combinations of PublicKeyCredentialType and cryptographic parameters in credTypesAndPubKeyAlgs is supported. If not, return an error code equivalent to "NotSupportedError" and terminate the operation.
      it("should throw error when input does not contain any supported algorithms", async () => {
        const result = async () =>
          await authenticator.makeCredential(invalidParams.unsupportedAlgorithm);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.NotSupported);
      });

      it("should throw error when requireResidentKey has invalid value", async () => {
        const result = async () => await authenticator.makeCredential(invalidParams.invalidRk);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.Unknown);
      });

      it("should throw error when requireUserVerification has invalid value", async () => {
        const result = async () => await authenticator.makeCredential(invalidParams.invalidUv);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.Unknown);
      });

      /**
       * Spec: If requireUserVerification is true and the authenticator cannot perform user verification, return an error code equivalent to "ConstraintError" and terminate the operation.
       * Deviation: User verification is checked before checking for excluded credentials
       * */
      it("should throw error if requireUserVerification is set to true", async () => {
        const params = await createCredentialParams({ requireUserVerification: true });

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.Constraint);
      });

      it("should not request confirmation from user", async () => {
        userInterface.confirmNewCredential.mockResolvedValue(true);
        const invalidParams = await createInvalidParams();

        for (const p of Object.values(invalidParams)) {
          try {
            await authenticator.makeCredential(p);
            // eslint-disable-next-line no-empty
          } catch {}
        }
        expect(userInterface.confirmNewCredential).not.toHaveBeenCalled();
      });
    });

    describe.skip("when extensions parameter is present", () => undefined);

    describe("when vault contains excluded credential", () => {
      let excludedCipherView: CipherView;
      let params: Fido2AuthenticatorMakeCredentialsParams;

      beforeEach(async () => {
        const excludedCipher = createCipher();
        excludedCipherView = await excludedCipher.decrypt();
        params = await createCredentialParams({
          excludeCredentialDescriptorList: [
            { id: Fido2Utils.stringToBuffer(excludedCipher.id), type: "public-key" },
          ],
        });
        cipherService.get.mockImplementation(async (id) =>
          id === excludedCipher.id ? excludedCipher : undefined
        );
        cipherService.getAllDecrypted.mockResolvedValue([excludedCipherView]);
      });

      /**
       * Spec: collect an authorization gesture confirming user consent for creating a new credential.
       * Deviation: Consent is not asked and the user is simply informed of the situation.
       **/
      it("should inform user", async () => {
        userInterface.informExcludedCredential.mockResolvedValue();

        try {
          await authenticator.makeCredential(params);
          // eslint-disable-next-line no-empty
        } catch {}

        expect(userInterface.informExcludedCredential).toHaveBeenCalled();
      });

      /** Spec: return an error code equivalent to "NotAllowedError" and terminate the operation. */
      it("should throw error", async () => {
        userInterface.informExcludedCredential.mockResolvedValue();

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.NotAllowed);
      });

      it("should not inform user of duplication when input data does not pass checks", async () => {
        userInterface.informExcludedCredential.mockResolvedValue();
        const invalidParams = await createInvalidParams();

        for (const p of Object.values(invalidParams)) {
          try {
            await authenticator.makeCredential(p);
            // eslint-disable-next-line no-empty
          } catch {}
        }
        expect(userInterface.informExcludedCredential).not.toHaveBeenCalled();
      });
    });

    describe("creation of discoverable credential", () => {
      let params: Fido2AuthenticatorMakeCredentialsParams;

      beforeEach(async () => {
        params = await createCredentialParams({ requireResidentKey: true });
      });

      /**
       * Spec: Collect an authorization gesture confirming user consent for creating a new credential. The prompt for the authorization gesture is shown by the authenticator if it has its own output capability. The prompt SHOULD display rpEntity.id, rpEntity.name, userEntity.name and userEntity.displayName, if possible.
       * Deviation: Only `rpEntity.name` and `userEntity.name` is shown.
       * */
      it("should request confirmation from user", async () => {
        userInterface.confirmNewCredential.mockResolvedValue(true);

        await authenticator.makeCredential(params);

        expect(userInterface.confirmNewCredential).toHaveBeenCalledWith({
          credentialName: params.rpEntity.name,
          userName: params.userEntity.name,
        } as NewCredentialParams);
      });

      it("should save credential to vault if request confirmed by user", async () => {
        const encryptedCipher = Symbol();
        userInterface.confirmNewCredential.mockResolvedValue(true);
        cipherService.encrypt.mockResolvedValue(encryptedCipher as unknown as Cipher);

        await authenticator.makeCredential(params);

        const saved = cipherService.encrypt.mock.lastCall?.[0];
        expect(saved).toEqual(
          expect.objectContaining({
            type: CipherType.Fido2Key,
            name: params.rpEntity.name,

            fido2Key: expect.objectContaining({
              keyType: "ECDSA",
              keyCurve: "P-256",
              rpId: params.rpEntity.id,
              rpName: params.rpEntity.name,
              userHandle: Fido2Utils.bufferToString(params.userEntity.id),
              userName: params.userEntity.name,
            }),
          })
        );
        expect(cipherService.createWithServer).toHaveBeenCalledWith(encryptedCipher);
      });

      /** Spec: If the user does not consent or if user verification fails, return an error code equivalent to "NotAllowedError" and terminate the operation. */
      it("should throw error if user denies creation request", async () => {
        userInterface.confirmNewCredential.mockResolvedValue(false);

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.NotAllowed);
      });

      /** Spec: If any error occurred while creating the new credential object, return an error code equivalent to "UnknownError" and terminate the operation. */
      it("should throw unkown error if creation fails", async () => {
        const encryptedCipher = Symbol();
        userInterface.confirmNewCredential.mockResolvedValue(true);
        cipherService.encrypt.mockResolvedValue(encryptedCipher as unknown as Cipher);
        cipherService.createWithServer.mockRejectedValue(new Error("Internal error"));

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.Unknown);
      });
    });

    describe("creation of non-discoverable credential", () => {
      let existingCipherView: CipherView;
      let params: Fido2AuthenticatorMakeCredentialsParams;

      beforeEach(async () => {
        const existingCipher = createCipher({ type: CipherType.Login });
        existingCipher.login = new Login();
        existingCipher.fido2Key = undefined;
        existingCipherView = await existingCipher.decrypt();
        params = await createCredentialParams();
        cipherService.get.mockImplementation(async (id) =>
          id === existingCipher.id ? existingCipher : undefined
        );
        cipherService.getAllDecrypted.mockResolvedValue([existingCipherView]);
      });

      /**
       * Spec: Collect an authorization gesture confirming user consent for creating a new credential. The prompt for the authorization gesture is shown by the authenticator if it has its own output capability. The prompt SHOULD display rpEntity.id, rpEntity.name, userEntity.name and userEntity.displayName, if possible.
       * Deviation: Only `rpEntity.name` and `userEntity.name` is shown.
       * */
      it("should request confirmation from user", async () => {
        userInterface.confirmNewNonDiscoverableCredential.mockResolvedValue(existingCipherView.id);

        await authenticator.makeCredential(params);

        expect(userInterface.confirmNewNonDiscoverableCredential).toHaveBeenCalledWith({
          credentialName: params.rpEntity.name,
          userName: params.userEntity.name,
        } as NewCredentialParams);
      });

      it("should save credential to vault if request confirmed by user", async () => {
        const encryptedCipher = Symbol();
        userInterface.confirmNewNonDiscoverableCredential.mockResolvedValue(existingCipherView.id);
        cipherService.encrypt.mockResolvedValue(encryptedCipher as unknown as Cipher);

        await authenticator.makeCredential(params);

        const saved = cipherService.encrypt.mock.lastCall?.[0];
        expect(saved).toEqual(
          expect.objectContaining({
            type: CipherType.Login,
            name: existingCipherView.name,

            fido2Key: expect.objectContaining({
              keyType: "ECDSA",
              keyCurve: "P-256",
              rpId: params.rpEntity.id,
              rpName: params.rpEntity.name,
              userHandle: Fido2Utils.bufferToString(params.userEntity.id),
              userName: params.userEntity.name,
            }),
          })
        );
        expect(cipherService.updateWithServer).toHaveBeenCalledWith(encryptedCipher);
      });

      /** Spec: If the user does not consent or if user verification fails, return an error code equivalent to "NotAllowedError" and terminate the operation. */
      it("should throw error if user denies creation request", async () => {
        userInterface.confirmNewNonDiscoverableCredential.mockResolvedValue(undefined);
        const params = await createCredentialParams();

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.NotAllowed);
      });

      /** Spec: If any error occurred while creating the new credential object, return an error code equivalent to "UnknownError" and terminate the operation. */
      it("should throw unkown error if creation fails", async () => {
        const encryptedCipher = Symbol();
        userInterface.confirmNewNonDiscoverableCredential.mockResolvedValue(existingCipherView.id);
        cipherService.encrypt.mockResolvedValue(encryptedCipher as unknown as Cipher);
        cipherService.updateWithServer.mockRejectedValue(new Error("Internal error"));

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.Unknown);
      });
    });
  });
});

async function createCredentialParams(
  params: Partial<Fido2AuthenticatorMakeCredentialsParams> = {}
): Promise<Fido2AuthenticatorMakeCredentialsParams> {
  return {
    hash: params.hash ?? (await createClientDataHash()),
    rpEntity: params.rpEntity ?? {
      name: "Bitwarden",
      id: RpId,
    },
    userEntity: params.userEntity ?? {
      id: randomBytes(64),
      name: "jane.doe@bitwarden.com",
      displayName: "Jane Doe",
      icon: " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAOhJREFUeNpiFI+9E8DAwDAfiAUYSAMfgDiQBVmzlSYnUTqPXf/OANWzngVZ87pKKaIMCGp/BjeEhRjFMKAjx8bQFC2CIs9CpHNxAiYGCsEQM4Cfiwm3AY9f/yZogIcRN4ZahAFv/jAcu4E7xMNtecEYpAakFqsX8me9Yvj07R+G5jR3foaJqWJgOZAaZMAIzAv/kQV05NgZ5hdIMMiKQJIIyEYrDU6wrYkTXjBcefQTvwGwwCoJFGJIBdoMArN3fmToWf+O4SMW14EMeI8rJ8Jcgexn9BwJCoNEaNbEACCN+DSDsjNAgAEAri9Zii/uDMsAAAAASUVORK5CYII=",
    },
    credTypesAndPubKeyAlgs: params.credTypesAndPubKeyAlgs ?? [
      {
        alg: -7, // ES256
        type: "public-key",
      },
    ],
    excludeCredentialDescriptorList: params.excludeCredentialDescriptorList ?? [
      {
        id: randomBytes(16),
        transports: ["internal"],
        type: "public-key",
      },
    ],
    requireResidentKey: params.requireResidentKey ?? false,
    requireUserVerification: params.requireUserVerification ?? false,
    extensions: params.extensions ?? {
      appid: undefined,
      appidExclude: undefined,
      credProps: undefined,
      uvm: false as boolean,
    },
  };
}

type InvalidParams = Awaited<ReturnType<typeof createInvalidParams>>;
async function createInvalidParams() {
  return {
    unsupportedAlgorithm: await createCredentialParams({
      credTypesAndPubKeyAlgs: [{ alg: 9001, type: "public-key" }],
    }),
    invalidRk: await createCredentialParams({ requireResidentKey: "invalid-value" as any }),
    invalidUv: await createCredentialParams({ requireUserVerification: "invalid-value" as any }),
  };
}

function createCipher(data: Partial<Cipher> = {}): Cipher {
  const cipher = new Cipher();
  cipher.id = data.id ?? Utils.newGuid();
  cipher.type = data.type ?? CipherType.Fido2Key;
  cipher.fido2Key = data.fido2Key ?? new Fido2Key();
  return cipher;
}

async function createClientDataHash() {
  const encoder = new TextEncoder();
  const clientData = encoder.encode(
    JSON.stringify({
      type: "webauthn.create",
      challenge: Fido2Utils.bufferToString(randomBytes(16)),
      origin: RpId,
      crossOrigin: false,
    })
  );
  return await crypto.subtle.digest({ name: "SHA-256" }, clientData);
}

function randomBytes(length: number) {
  return new Uint8Array(Array.from({ length }, () => Math.floor(Math.random() * 255)));
}
