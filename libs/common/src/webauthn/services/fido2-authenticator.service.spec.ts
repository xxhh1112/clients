import { TextEncoder } from "util";

import { mock, MockProxy } from "jest-mock-extended";

import { Utils } from "../../misc/utils";
import { CipherService } from "../../vault/abstractions/cipher.service";
import { CipherType } from "../../vault/enums/cipher-type";
import { Cipher } from "../../vault/models/domain/cipher";
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
    // Spec: If the pubKeyCredParams parameter does not contain a valid COSEAlgorithmIdentifier value that is supported by the authenticator, terminate this procedure and return error code
    it("should throw error when input does not contain any supported algorithms", async () => {
      const params = await createCredentialParams({
        pubKeyCredParams: [{ alg: 9001, type: "public-key" }],
      });

      const result = async () => await authenticator.makeCredential(params);

      await expect(result).rejects.toThrowError(
        Fido2AutenticatorErrorCode[Fido2AutenticatorErrorCode.CTAP2_ERR_UNSUPPORTED_ALGORITHM]
      );
    });

    describe("when options parameter is present", () => {
      /** Spec: If the option is known but not valid for this command, terminate this procedure */
      it("should throw error when rk has invalid value", async () => {
        const params = await createCredentialParams({ options: { rk: "invalid-value" as any } });

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(
          Fido2AutenticatorErrorCode[Fido2AutenticatorErrorCode.CTAP2_ERR_INVALID_OPTION]
        );
      });

      /** Spec: If the option is known but not valid for this command, terminate this procedure */
      it("should throw error when uv has invalid value", async () => {
        const params = await createCredentialParams({ options: { uv: "invalid-value" as any } });

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(
          Fido2AutenticatorErrorCode[Fido2AutenticatorErrorCode.CTAP2_ERR_INVALID_OPTION]
        );
      });
    });

    /**
     * Spec: Optionally, if the extensions parameter is present, process any extensions that this authenticator supports.
     * Currently not supported.
     */
    describe.skip("when extensions parameter is present", () => undefined);

    /** Spec: If pinAuth parameter is present and the pinProtocol is not supported */
    describe("when pinAuth parameter is present", () => {
      it("should throw error", async () => {
        const params = await createCredentialParams({ pinAuth: { key: "value" } });

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(
          Fido2AutenticatorErrorCode[Fido2AutenticatorErrorCode.CTAP2_ERR_PIN_AUTH_INVALID]
        );
      });
    });

    describe("when vault contains excluded credential", () => {
      let excludedCipherView: CipherView;
      let params: Fido2AuthenticatorMakeCredentialsParams;

      beforeEach(async () => {
        const excludedCipher = createCipher();
        excludedCipherView = await excludedCipher.decrypt();
        params = await createCredentialParams({
          excludeList: [{ id: Fido2Utils.stringToBuffer(excludedCipher.id), type: "public-key" }],
        });
        cipherService.get.mockImplementation(async (id) =>
          id === excludedCipher.id ? excludedCipher : undefined
        );
        cipherService.getAllDecrypted.mockResolvedValue([excludedCipherView]);
      });

      /** Spec: wait for user presence */
      it("should request confirmation from user", async () => {
        userInterface.confirmDuplicateCredential.mockResolvedValue(true);

        await authenticator.makeCredential(params);

        expect(userInterface.confirmDuplicateCredential).toHaveBeenCalled();
      });

      /** Spec: then terminate this procedure and return error code */
      it("should throw error if user denies duplication", async () => {
        userInterface.confirmDuplicateCredential.mockResolvedValue(false);

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(
          Fido2AutenticatorErrorCode[Fido2AutenticatorErrorCode.CTAP2_ERR_CREDENTIAL_EXCLUDED]
        );
      });

      /** Departure from spec: Check duplication last instead of first */
      it("should not request confirmation from user when input data does not pass checks", async () => {
        userInterface.confirmDuplicateCredential.mockResolvedValue(true);
        const paramsList: Fido2AuthenticatorMakeCredentialsParams[] = [
          { ...params, options: { rk: "invalid-value" as any } },
          { ...params, options: { uv: "invalid-value" as any } },
          { ...params, pinAuth: { key: "value" } },
          { ...params, pubKeyCredParams: [{ alg: 9001, type: "public-key" }] },
        ];

        for (const p of paramsList) {
          try {
            await authenticator.makeCredential(p);
            // eslint-disable-next-line no-empty
          } catch {}
        }
        expect(userInterface.confirmDuplicateCredential).not.toHaveBeenCalled();
      });
    });

    describe("when input passes all initial checks", () => {
      /** Spec: show the items contained within the user and rp parameter structures to the user. */
      it("should request confirmation from user", async () => {
        userInterface.confirmNewCredential.mockResolvedValue(true);
        const params = await createCredentialParams();

        await authenticator.makeCredential(params);

        expect(userInterface.confirmNewCredential).toHaveBeenCalledWith({
          credentialName: params.rp.name,
          userName: params.user.name,
        } as NewCredentialParams);
      });

      /** Spec: If the user declines permission */
      it("should throw error if user denies creation request", async () => {
        userInterface.confirmNewCredential.mockResolvedValue(false);
        const params = await createCredentialParams();

        const result = async () => await authenticator.makeCredential(params);

        await expect(result).rejects.toThrowError(
          Fido2AutenticatorErrorCode[Fido2AutenticatorErrorCode.CTAP2_ERR_OPERATION_DENIED]
        );
      });
    });

    it("should not request confirmation from user when input data does not pass checks", async () => {
      userInterface.confirmDuplicateCredential.mockResolvedValue(true);
      const params = await createCredentialParams();
      const paramsList: Fido2AuthenticatorMakeCredentialsParams[] = [
        { ...params, options: { rk: "invalid-value" as any } },
        { ...params, options: { uv: "invalid-value" as any } },
        { ...params, pinAuth: { key: "value" } },
        { ...params, pubKeyCredParams: [{ alg: 9001, type: "public-key" }] },
      ];

      for (const p of paramsList) {
        try {
          await authenticator.makeCredential(p);
          // eslint-disable-next-line no-empty
        } catch {}
      }
      expect(userInterface.confirmNewCredential).not.toHaveBeenCalled();
    });
  });
});

async function createCredentialParams(
  params: Partial<Fido2AuthenticatorMakeCredentialsParams> = {}
): Promise<Fido2AuthenticatorMakeCredentialsParams> {
  return {
    clientDataHash: params.clientDataHash ?? (await createClientDataHash()),
    rp: params.rp ?? {
      name: "Bitwarden",
      id: RpId,
    },
    user: params.user ?? {
      id: randomBytes(64),
      name: "jane.doe@bitwarden.com",
      displayName: "Jane Doe",
      icon: " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAOhJREFUeNpiFI+9E8DAwDAfiAUYSAMfgDiQBVmzlSYnUTqPXf/OANWzngVZ87pKKaIMCGp/BjeEhRjFMKAjx8bQFC2CIs9CpHNxAiYGCsEQM4Cfiwm3AY9f/yZogIcRN4ZahAFv/jAcu4E7xMNtecEYpAakFqsX8me9Yvj07R+G5jR3foaJqWJgOZAaZMAIzAv/kQV05NgZ5hdIMMiKQJIIyEYrDU6wrYkTXjBcefQTvwGwwCoJFGJIBdoMArN3fmToWf+O4SMW14EMeI8rJ8Jcgexn9BwJCoNEaNbEACCN+DSDsjNAgAEAri9Zii/uDMsAAAAASUVORK5CYII=",
    },
    pubKeyCredParams: params.pubKeyCredParams ?? [
      {
        alg: -7, // ES256
        type: "public-key",
      },
    ],
    excludeList: params.excludeList ?? [
      {
        id: randomBytes(16),
        transports: ["internal"],
        type: "public-key",
      },
    ],
    extensions: params.extensions ?? {
      appid: undefined,
      appidExclude: undefined,
      credProps: undefined,
      uvm: false as boolean,
    },
    options: params.options ?? {
      rk: false as boolean,
      uv: false as boolean,
    },
    pinAuth: params.pinAuth,
  };
}

function createCipher(id = Utils.newGuid()): Cipher {
  const cipher = new Cipher();
  cipher.id = id;
  cipher.type = CipherType.Fido2Key;
  cipher.fido2Key = new Fido2Key();
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
