import { TextEncoder } from "util";

import { CBOR } from "cbor-redux";
import { mock, MockProxy } from "jest-mock-extended";

import { Utils } from "../../misc/utils";
import { CipherService } from "../../vault/abstractions/cipher.service";
import { CipherType } from "../../vault/enums/cipher-type";
import { Cipher } from "../../vault/models/domain/cipher";
import { CipherView } from "../../vault/models/view/cipher.view";
import { LoginView } from "../../vault/models/view/login.view";
import {
  Fido2AutenticatorErrorCode,
  Fido2AuthenticatorGetAssertionParams,
  Fido2AuthenticatorMakeCredentialsParams,
} from "../abstractions/fido2-authenticator.service.abstraction";
import {
  Fido2UserInterfaceService,
  NewCredentialParams,
} from "../abstractions/fido2-user-interface.service.abstraction";
import { Fido2Utils } from "../abstractions/fido2-utils";
import { Fido2KeyView } from "../models/view/fido2-key.view";

import { AAGUID, Fido2AuthenticatorService } from "./fido2-authenticator.service";

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

  describe("makeCredential", () => {
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
        const params = await createParams({ requireUserVerification: true });

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

    describe("vault contains excluded non-discoverable credential", () => {
      let excludedCipher: CipherView;
      let params: Fido2AuthenticatorMakeCredentialsParams;

      beforeEach(async () => {
        excludedCipher = createCipherView(
          { type: CipherType.Login },
          { nonDiscoverableId: Utils.newGuid() }
        );
        params = await createParams({
          excludeCredentialDescriptorList: [
            {
              id: Utils.guidToRawFormat(excludedCipher.fido2Key.nonDiscoverableId),
              type: "public-key",
            },
          ],
        });
        cipherService.get.mockImplementation(async (id) =>
          id === excludedCipher.id ? ({ decrypt: () => excludedCipher } as any) : undefined
        );
        cipherService.getAllDecrypted.mockResolvedValue([excludedCipher]);
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

      it.todo(
        "should not throw error if the excluded credential has been marked as deleted in the vault"
      );
    });

    describe("vault contains excluded discoverable credential", () => {
      let excludedCipherView: CipherView;
      let params: Fido2AuthenticatorMakeCredentialsParams;

      beforeEach(async () => {
        const excludedCipher = createCipherView();
        excludedCipherView = await excludedCipher;
        params = await createParams({
          excludeCredentialDescriptorList: [
            { id: Utils.guidToRawFormat(excludedCipher.id), type: "public-key" },
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

      it.todo(
        "should not throw error if the excluded credential has been marked as deleted in the vault"
      );
    });

    describe("creation of discoverable credential", () => {
      let params: Fido2AuthenticatorMakeCredentialsParams;

      beforeEach(async () => {
        params = await createParams({ requireResidentKey: true });
        cipherService.getAllDecrypted.mockResolvedValue([]);
      });

      /**
       * Spec: Collect an authorization gesture confirming user consent for creating a new credential. The prompt for the authorization gesture is shown by the authenticator if it has its own output capability. The prompt SHOULD display rpEntity.id, rpEntity.name, userEntity.name and userEntity.displayName, if possible.
       * Deviation: Only `rpEntity.name` and `userEntity.name` is shown.
       * */
      it("should request confirmation from user", async () => {
        userInterface.confirmNewCredential.mockResolvedValue(true);
        cipherService.encrypt.mockResolvedValue({} as unknown as Cipher);
        cipherService.createWithServer.mockImplementation(async (cipher) => {
          cipher.id = Utils.newGuid();
          return cipher;
        });

        await authenticator.makeCredential(params);

        expect(userInterface.confirmNewCredential).toHaveBeenCalledWith({
          credentialName: params.rpEntity.name,
          userName: params.userEntity.name,
        } as NewCredentialParams);
      });

      it("should save credential to vault if request confirmed by user", async () => {
        const encryptedCipher = {};
        userInterface.confirmNewCredential.mockResolvedValue(true);
        cipherService.encrypt.mockResolvedValue(encryptedCipher as unknown as Cipher);
        cipherService.createWithServer.mockImplementation(async (cipher) => {
          cipher.id = Utils.newGuid();
          return cipher;
        });

        await authenticator.makeCredential(params);

        const saved = cipherService.encrypt.mock.lastCall?.[0];
        expect(saved).toEqual(
          expect.objectContaining({
            type: CipherType.Fido2Key,
            name: params.rpEntity.name,

            fido2Key: expect.objectContaining({
              nonDiscoverableId: null,
              keyType: "public-key",
              keyAlgorithm: "ECDSA",
              keyCurve: "P-256",
              rpId: params.rpEntity.id,
              rpName: params.rpEntity.name,
              userHandle: Fido2Utils.bufferToString(params.userEntity.id),
              counter: 0,
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
        const encryptedCipher = {};
        userInterface.confirmNewCredential.mockResolvedValue(true);
        cipherService.encrypt.mockResolvedValue(encryptedCipher as unknown as Cipher);
        cipherService.createWithServer.mockRejectedValue(new Error("Internal error"));

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.Unknown);
      });
    });

    describe("creation of non-discoverable credential", () => {
      let existingCipher: CipherView;
      let params: Fido2AuthenticatorMakeCredentialsParams;

      beforeEach(async () => {
        existingCipher = createCipherView({ type: CipherType.Login });
        params = await createParams();
        cipherService.get.mockImplementation(async (id) =>
          id === existingCipher.id ? ({ decrypt: () => existingCipher } as any) : undefined
        );
        cipherService.getAllDecrypted.mockResolvedValue([existingCipher]);
      });

      /**
       * Spec: Collect an authorization gesture confirming user consent for creating a new credential. The prompt for the authorization gesture is shown by the authenticator if it has its own output capability. The prompt SHOULD display rpEntity.id, rpEntity.name, userEntity.name and userEntity.displayName, if possible.
       * Deviation: Only `rpEntity.name` and `userEntity.name` is shown.
       * */
      it("should request confirmation from user", async () => {
        userInterface.confirmNewNonDiscoverableCredential.mockResolvedValue(existingCipher.id);

        await authenticator.makeCredential(params);

        expect(userInterface.confirmNewNonDiscoverableCredential).toHaveBeenCalledWith({
          credentialName: params.rpEntity.name,
          userName: params.userEntity.name,
        } as NewCredentialParams);
      });

      it("should save credential to vault if request confirmed by user", async () => {
        const encryptedCipher = Symbol();
        userInterface.confirmNewNonDiscoverableCredential.mockResolvedValue(existingCipher.id);
        cipherService.encrypt.mockResolvedValue(encryptedCipher as unknown as Cipher);

        await authenticator.makeCredential(params);

        const saved = cipherService.encrypt.mock.lastCall?.[0];
        expect(saved).toEqual(
          expect.objectContaining({
            type: CipherType.Login,
            name: existingCipher.name,

            fido2Key: expect.objectContaining({
              nonDiscoverableId: expect.anything(),
              keyType: "public-key",
              keyAlgorithm: "ECDSA",
              keyCurve: "P-256",
              rpId: params.rpEntity.id,
              rpName: params.rpEntity.name,
              userHandle: Fido2Utils.bufferToString(params.userEntity.id),
              counter: 0,
              userName: params.userEntity.name,
            }),
          })
        );
        expect(cipherService.updateWithServer).toHaveBeenCalledWith(encryptedCipher);
      });

      /** Spec: If the user does not consent or if user verification fails, return an error code equivalent to "NotAllowedError" and terminate the operation. */
      it("should throw error if user denies creation request", async () => {
        userInterface.confirmNewNonDiscoverableCredential.mockResolvedValue(undefined);
        const params = await createParams();

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.NotAllowed);
      });

      /** Spec: If any error occurred while creating the new credential object, return an error code equivalent to "UnknownError" and terminate the operation. */
      it("should throw unkown error if creation fails", async () => {
        const encryptedCipher = Symbol();
        userInterface.confirmNewNonDiscoverableCredential.mockResolvedValue(existingCipher.id);
        cipherService.encrypt.mockResolvedValue(encryptedCipher as unknown as Cipher);
        cipherService.updateWithServer.mockRejectedValue(new Error("Internal error"));

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.Unknown);
      });
    });

    for (const requireResidentKey of [true, false]) {
      describe(`attestation of new ${
        requireResidentKey ? "discoverable" : "non-discoverable"
      } credential`, () => {
        const cipherId = "75280e7e-a72e-4d6c-bf1e-d37238352f9b";
        const cipherIdBytes = new Uint8Array([
          0x75, 0x28, 0x0e, 0x7e, 0xa7, 0x2e, 0x4d, 0x6c, 0xbf, 0x1e, 0xd3, 0x72, 0x38, 0x35, 0x2f,
          0x9b,
        ]);
        const nonDiscoverableId = "52217b91-73f1-4fea-b3f2-54a7959fd5aa";
        const nonDiscoverableIdBytes = new Uint8Array([
          0x52, 0x21, 0x7b, 0x91, 0x73, 0xf1, 0x4f, 0xea, 0xb3, 0xf2, 0x54, 0xa7, 0x95, 0x9f, 0xd5,
          0xaa,
        ]);
        let params: Fido2AuthenticatorMakeCredentialsParams;

        beforeEach(async () => {
          const cipher = createCipherView({ id: cipherId, type: CipherType.Login });
          params = await createParams({ requireResidentKey });
          userInterface.confirmNewNonDiscoverableCredential.mockResolvedValue(cipherId);
          userInterface.confirmNewCredential.mockResolvedValue(true);
          cipherService.get.mockImplementation(async (cipherId) =>
            cipherId === cipher.id ? ({ decrypt: () => cipher } as any) : undefined
          );
          cipherService.getAllDecrypted.mockResolvedValue([await cipher]);
          cipherService.encrypt.mockImplementation(async (cipher) => {
            cipher.fido2Key.nonDiscoverableId = nonDiscoverableId; // Replace id for testability
            return {} as any;
          });
          cipherService.createWithServer.mockImplementation(async (cipher) => {
            cipher.id = cipherId;
            return cipher;
          });
          cipherService.updateWithServer.mockImplementation(async (cipher) => {
            cipher.id = cipherId;
            return cipher;
          });
        });

        it("should return attestation object", async () => {
          const result = await authenticator.makeCredential(params);

          const attestationObject = CBOR.decode(result.buffer);

          const encAuthData: Uint8Array = attestationObject.authData;
          const rpIdHash = encAuthData.slice(0, 32);
          const flags = encAuthData.slice(32, 33);
          const counter = encAuthData.slice(33, 37);
          const aaguid = encAuthData.slice(37, 53);
          const credentialIdLength = encAuthData.slice(53, 55);
          const credentialId = encAuthData.slice(55, 71);
          // Public key format is not tested here since it will be tested
          // by the assertion tests.
          // const publicKey = encAuthData.slice(87);

          expect(attestationObject.fmt).toBe("none");
          expect(attestationObject.attStmt).toEqual({});
          expect(rpIdHash).toEqual(
            new Uint8Array([
              0x22, 0x6b, 0xb3, 0x92, 0x02, 0xff, 0xf9, 0x22, 0xdc, 0x74, 0x05, 0xcd, 0x28, 0xa8,
              0x34, 0x5a, 0xc4, 0xf2, 0x64, 0x51, 0xd7, 0x3d, 0x0b, 0x40, 0xef, 0xf3, 0x1d, 0xc1,
              0xd0, 0x5c, 0x3d, 0xc3,
            ])
          );
          expect(flags).toEqual(new Uint8Array([0b00000001])); // UP = true
          expect(counter).toEqual(new Uint8Array([0, 0, 0, 0])); // 0 because of new counter
          expect(aaguid).toEqual(AAGUID);
          expect(credentialIdLength).toEqual(new Uint8Array([0, 16])); // 16 bytes because we're using GUIDs
          if (requireResidentKey) {
            expect(credentialId).toEqual(cipherIdBytes);
          } else {
            expect(credentialId).toEqual(nonDiscoverableIdBytes);
          }
        });
      });
    }

    async function createParams(
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
        unsupportedAlgorithm: await createParams({
          credTypesAndPubKeyAlgs: [{ alg: 9001, type: "public-key" }],
        }),
        invalidRk: await createParams({ requireResidentKey: "invalid-value" as any }),
        invalidUv: await createParams({
          requireUserVerification: "invalid-value" as any,
        }),
      };
    }
  });

  describe("getAssertion", () => {
    let invalidParams!: InvalidParams;

    beforeEach(async () => {
      invalidParams = await createInvalidParams();
    });

    describe("invalid input parameters", () => {
      it("should throw error when requireUserVerification has invalid value", async () => {
        const result = async () => await authenticator.getAssertion(invalidParams.invalidUv);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.Unknown);
      });

      /** Deviation: User verification is checked before checking for credentials */
      it("should throw error if requireUserVerification is set to true", async () => {
        const params = await createParams({ requireUserVerification: true });

        const result = async () => await authenticator.getAssertion(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.Constraint);
      });
    });

    describe("vault is missing non-discoverable credential", () => {
      let credentialId: string;
      let params: Fido2AuthenticatorGetAssertionParams;

      beforeEach(async () => {
        credentialId = Utils.newGuid();
        params = await createParams({
          allowCredentialDescriptorList: [
            { id: Utils.guidToRawFormat(credentialId), type: "public-key" },
          ],
          rpId: RpId,
        });
      });

      /** Spec: If credentialOptions is now empty, return an error code equivalent to "NotAllowedError" and terminate the operation. */
      it("should throw error if no credential exists", async () => {
        cipherService.getAllDecrypted.mockResolvedValue([]);

        const result = async () => await authenticator.getAssertion(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.NotAllowed);
      });

      it("should throw error if credential exists but rpId does not match", async () => {
        const cipher = await createCipherView({ type: CipherType.Login });
        cipher.fido2Key.nonDiscoverableId = credentialId;
        cipher.fido2Key.rpId = "mismatch-rpid";
        cipherService.getAllDecrypted.mockResolvedValue([cipher]);

        const result = async () => await authenticator.getAssertion(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.NotAllowed);
      });
    });

    describe("vault is missing discoverable credential", () => {
      let params: Fido2AuthenticatorGetAssertionParams;

      beforeEach(async () => {
        params = await createParams({
          allowCredentialDescriptorList: [],
          rpId: RpId,
        });
        cipherService.getAllDecrypted.mockResolvedValue([]);
      });

      /** Spec: If credentialOptions is now empty, return an error code equivalent to "NotAllowedError" and terminate the operation. */
      it("should throw error", async () => {
        const result = async () => await authenticator.getAssertion(params);

        await expect(result).rejects.toThrowError(Fido2AutenticatorErrorCode.NotAllowed);
      });
    });

    describe("assertion of non-discoverable credential", () => {
      let credentialIds: string[];
      let ciphers: CipherView[];
      let params: Fido2AuthenticatorGetAssertionParams;

      beforeEach(async () => {
        credentialIds = [Utils.newGuid(), Utils.newGuid()];
        ciphers = await Promise.all(
          credentialIds.map((id) =>
            createCipherView({ type: CipherType.Login }, { nonDiscoverableId: id, rpId: RpId })
          )
        );
        params = await createParams({
          allowCredentialDescriptorList: credentialIds.map((credentialId) => ({
            id: Utils.guidToRawFormat(credentialId),
            type: "public-key",
          })),
          rpId: RpId,
        });
        cipherService.getAllDecrypted.mockResolvedValue(ciphers);
      });

      /** Spec: Prompt the user to select a public key credential source selectedCredential from credentialOptions. */
      it("should request confirmation from the user", async () => {
        await authenticator.getAssertion(params);

        expect(userInterface.pickCredential).toHaveBeenCalledWith(ciphers.map((c) => c.id));
      });
    });

    async function createParams(
      params: Partial<Fido2AuthenticatorGetAssertionParams> = {}
    ): Promise<Fido2AuthenticatorGetAssertionParams> {
      return {
        rpId: params.rpId ?? RpId,
        hash: params.hash ?? (await createClientDataHash()),
        allowCredentialDescriptorList: params.allowCredentialDescriptorList ?? [],
        requireUserVerification: params.requireUserVerification ?? false,
        extensions: params.extensions ?? {},
      };
    }

    type InvalidParams = Awaited<ReturnType<typeof createInvalidParams>>;
    async function createInvalidParams() {
      const emptyRpId = await createParams();
      emptyRpId.rpId = undefined as any;
      return {
        emptyRpId,
        invalidUv: await createParams({
          requireUserVerification: "invalid-value" as any,
        }),
      };
    }
  });
});

function createCipherView(
  data: Partial<Omit<CipherView, "fido2Key">> = {},
  fido2Key: Partial<Fido2KeyView> = {}
): CipherView {
  const cipher = new CipherView();
  cipher.id = data.id ?? Utils.newGuid();
  cipher.type = data.type ?? CipherType.Fido2Key;
  cipher.login = data.type ?? data.type === CipherType.Login ? new LoginView() : null;
  cipher.fido2Key = new Fido2KeyView();
  cipher.fido2Key.nonDiscoverableId = fido2Key.nonDiscoverableId;
  cipher.fido2Key.rpId = fido2Key.rpId;
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
