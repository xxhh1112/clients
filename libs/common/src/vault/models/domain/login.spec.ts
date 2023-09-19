// eslint-disable-next-line no-restricted-imports
import { Substitute, Arg } from "@fluffy-spoon/substitute";

import { mockEnc, mockFromJson } from "../../../../spec";
import { UriMatchType } from "../../../enums";
import { EncryptedString, EncString } from "../../../platform/models/domain/enc-string";
import { Fido2KeyApi } from "../../api/fido2-key.api";
import { LoginData } from "../../models/data/login.data";
import { Login } from "../../models/domain/login";
import { LoginUri } from "../../models/domain/login-uri";
import { LoginUriView } from "../../models/view/login-uri.view";
import { Fido2KeyData } from "../data/fido2-key.data";
import { Fido2KeyView } from "../view/fido2-key.view";

import { Fido2Key } from "./fido2-key";

describe("Login DTO", () => {
  it("Convert from empty LoginData", () => {
    const data = new LoginData();
    const login = new Login(data);

    expect(login).toEqual({
      passwordRevisionDate: null,
      autofillOnPageLoad: undefined,
      username: null,
      password: null,
      totp: null,
      fido2Keys: [],
    });
  });

  it("Convert from full LoginData", () => {
    const fido2KeyData = initializeFido2Key(new Fido2KeyData());
    const data: LoginData = {
      uris: [{ uri: "uri", match: UriMatchType.Domain }],
      username: "username",
      password: "password",
      passwordRevisionDate: "2022-01-31T12:00:00.000Z",
      totp: "123",
      autofillOnPageLoad: false,
      fido2Keys: [fido2KeyData],
    };
    const login = new Login(data);

    expect(login).toEqual({
      passwordRevisionDate: new Date("2022-01-31T12:00:00.000Z"),
      autofillOnPageLoad: false,
      username: { encryptedString: "username", encryptionType: 0 },
      password: { encryptedString: "password", encryptionType: 0 },
      totp: { encryptedString: "123", encryptionType: 0 },
      uris: [{ match: 0, uri: { encryptedString: "uri", encryptionType: 0 } }],
      fido2Keys: [encryptFido2Key(fido2KeyData)],
    });
  });

  it("Initialize without LoginData", () => {
    const login = new Login();

    expect(login).toEqual({
      fido2Keys: [],
    });
  });

  it("Decrypts correctly", async () => {
    const loginUri = Substitute.for<LoginUri>();
    const loginUriView = new LoginUriView();
    loginUriView.uri = "decrypted uri";
    loginUri.decrypt(Arg.any()).resolves(loginUriView);

    const login = new Login();
    const decryptedFido2Key = Symbol();
    login.uris = [loginUri];
    login.username = mockEnc("encrypted username");
    login.password = mockEnc("encrypted password");
    login.passwordRevisionDate = new Date("2022-01-31T12:00:00.000Z");
    login.totp = mockEnc("encrypted totp");
    login.autofillOnPageLoad = true;
    login.fido2Keys = [{ decrypt: jest.fn().mockReturnValue(decryptedFido2Key) } as any];

    const loginView = await login.decrypt(null);
    expect(loginView).toEqual({
      username: "encrypted username",
      password: "encrypted password",
      passwordRevisionDate: new Date("2022-01-31T12:00:00.000Z"),
      totp: "encrypted totp",
      uris: [
        {
          match: null,
          _uri: "decrypted uri",
          _domain: null,
          _hostname: null,
          _host: null,
          _canLaunch: null,
        },
      ],
      autofillOnPageLoad: true,
      fido2Keys: [decryptedFido2Key],
    });
  });

  it("Converts from LoginData and back", () => {
    const data: LoginData = {
      uris: [{ uri: "uri", match: UriMatchType.Domain }],
      username: "username",
      password: "password",
      passwordRevisionDate: "2022-01-31T12:00:00.000Z",
      totp: "123",
      autofillOnPageLoad: false,
      fido2Keys: [initializeFido2Key(new Fido2KeyData())],
    };
    const login = new Login(data);

    const loginData = login.toLoginData();

    expect(loginData).toEqual(data);
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(EncString, "fromJSON").mockImplementation(mockFromJson);
      jest.spyOn(LoginUri, "fromJSON").mockImplementation(mockFromJson);
      const passwordRevisionDate = new Date("2022-01-31T12:00:00.000Z");

      const actual = Login.fromJSON({
        uris: ["loginUri1", "loginUri2"] as any,
        username: "myUsername" as EncryptedString,
        password: "myPassword" as EncryptedString,
        passwordRevisionDate: passwordRevisionDate.toISOString(),
        totp: "myTotp" as EncryptedString,
        fido2Keys: [
          {
            credentialId: "keyId" as EncryptedString,
            keyType: "keyType" as EncryptedString,
            keyAlgorithm: "keyAlgorithm" as EncryptedString,
            keyCurve: "keyCurve" as EncryptedString,
            keyValue: "keyValue" as EncryptedString,
            rpId: "rpId" as EncryptedString,
            userHandle: "userHandle" as EncryptedString,
            counter: "counter" as EncryptedString,
            rpName: "rpName" as EncryptedString,
            userDisplayName: "userDisplayName" as EncryptedString,
            discoverable: "discoverable" as EncryptedString,
          },
        ],
      });

      expect(actual).toEqual({
        uris: ["loginUri1_fromJSON", "loginUri2_fromJSON"] as any,
        username: "myUsername_fromJSON",
        password: "myPassword_fromJSON",
        passwordRevisionDate: passwordRevisionDate,
        totp: "myTotp_fromJSON",
        fido2Keys: [
          {
            credentialId: "keyId_fromJSON",
            keyType: "keyType_fromJSON",
            keyAlgorithm: "keyAlgorithm_fromJSON",
            keyCurve: "keyCurve_fromJSON",
            keyValue: "keyValue_fromJSON",
            rpId: "rpId_fromJSON",
            userHandle: "userHandle_fromJSON",
            counter: "counter_fromJSON",
            rpName: "rpName_fromJSON",
            userDisplayName: "userDisplayName_fromJSON",
            discoverable: "discoverable_fromJSON",
          },
        ],
      });
      expect(actual).toBeInstanceOf(Login);
    });

    it("returns null if object is null", () => {
      expect(Login.fromJSON(null)).toBeNull();
    });
  });
});

type Fido2KeyLike = Fido2KeyData | Fido2KeyView | Fido2KeyApi;
function initializeFido2Key<T extends Fido2KeyLike>(key: T): T {
  key.credentialId = "credentialId";
  key.keyType = "public-key";
  key.keyAlgorithm = "ECDSA";
  key.keyCurve = "P-256";
  key.keyValue = "keyValue";
  key.rpId = "rpId";
  key.userHandle = "userHandle";
  key.counter = "counter";
  key.rpName = "rpName";
  key.userDisplayName = "userDisplayName";
  key.discoverable = "discoverable";
  return key;
}

function encryptFido2Key(key: Fido2KeyLike): Fido2Key {
  const encrypted = new Fido2Key();
  encrypted.credentialId = { encryptedString: key.credentialId, encryptionType: 0 } as EncString;
  encrypted.keyType = { encryptedString: key.keyType, encryptionType: 0 } as EncString;
  encrypted.keyAlgorithm = { encryptedString: key.keyAlgorithm, encryptionType: 0 } as EncString;
  encrypted.keyCurve = { encryptedString: key.keyCurve, encryptionType: 0 } as EncString;
  encrypted.keyValue = { encryptedString: key.keyValue, encryptionType: 0 } as EncString;
  encrypted.rpId = { encryptedString: key.rpId, encryptionType: 0 } as EncString;
  encrypted.userHandle = { encryptedString: key.userHandle, encryptionType: 0 } as EncString;
  encrypted.counter = { encryptedString: key.counter, encryptionType: 0 } as EncString;
  encrypted.rpName = { encryptedString: key.rpName, encryptionType: 0 } as EncString;
  encrypted.userDisplayName = {
    encryptedString: key.userDisplayName,
    encryptionType: 0,
  } as EncString;
  encrypted.discoverable = { encryptedString: key.discoverable, encryptionType: 0 } as EncString;
  return encrypted;
}
