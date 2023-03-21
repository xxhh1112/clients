import { TextEncoder } from "util";

import { mock, MockProxy } from "jest-mock-extended";

import { Utils } from "../../misc/utils";
import { CipherService } from "../../vault/abstractions/cipher.service";
import { CipherType } from "../../vault/enums/cipher-type";
import { CipherView } from "../../vault/models/view/cipher.view";
import {
  Fido2AutenticatorErrorCode,
  Fido2AuthenticatorMakeCredentialsParams,
} from "../abstractions/fido2-authenticator.service.abstraction";
import { Fido2UserInterfaceService } from "../abstractions/fido2-user-interface.service.abstraction";
import { Fido2Utils } from "../abstractions/fido2-utils";
import { Fido2KeyView } from "../models/view/fido2-key.view";

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
    describe("when vault contains excluded credential", () => {
      let excludedCipher: CipherView;
      let params: Fido2AuthenticatorMakeCredentialsParams;

      beforeEach(async () => {
        excludedCipher = createCipherView();
        params = await createCredentialParams({
          excludeList: [{ id: Fido2Utils.stringToBuffer(excludedCipher.id), type: "public-key" }],
        });
        cipherService.getAllDecrypted.mockResolvedValue([excludedCipher]);
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
        alg: -1, // ES256
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
  };
}

function createCipherView(id = Utils.newGuid()): CipherView {
  const cipher = new CipherView();
  cipher.id = id;
  cipher.type = CipherType.Fido2Key;
  cipher.fido2Key = new Fido2KeyView();
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
