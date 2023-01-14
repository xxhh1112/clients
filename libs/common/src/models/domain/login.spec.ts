import { mockFromJson } from "../../../spec/utils";
import { UriMatchType } from "../../enums/uriMatchType";
import { LoginData } from "../data/login.data";

import { Login } from "./login";
import { LoginUri } from "./login-uri";

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
    });
  });

  it("Convert from full LoginData", () => {
    const data: LoginData = {
      uris: [{ uri: "uri", match: UriMatchType.Domain }],
      username: "username",
      password: "password",
      passwordRevisionDate: "2022-01-31T12:00:00.000Z",
      totp: "123",
      autofillOnPageLoad: false,
    };
    const login = new Login(data);

    expect(login).toEqual({
      passwordRevisionDate: new Date("2022-01-31T12:00:00.000Z"),
      autofillOnPageLoad: false,
      username: { encryptedString: "username", encryptionType: 0 },
      password: { encryptedString: "password", encryptionType: 0 },
      totp: { encryptedString: "123", encryptionType: 0 },
      uris: [{ match: 0, uri: { encryptedString: "uri", encryptionType: 0 } }],
    });
  });

  it("Initialize without LoginData", () => {
    const login = new Login();

    expect(login).toEqual({});
  });

  it("Converts from LoginData and back", () => {
    const data: LoginData = {
      uris: [{ uri: "uri", match: UriMatchType.Domain }],
      username: "username",
      password: "password",
      passwordRevisionDate: "2022-01-31T12:00:00.000Z",
      totp: "123",
      autofillOnPageLoad: false,
    };
    const login = new Login(data);

    const loginData = login.toLoginData();

    expect(loginData).toEqual(data);
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(LoginUri, "fromJSON").mockImplementation(mockFromJson);
      const passwordRevisionDate = new Date("2022-01-31T12:00:00.000Z");

      const actual = Login.fromJSON({
        uris: ["loginUri1", "loginUri2"] as any,
        username: "myUsername",
        password: "myPassword",
        passwordRevisionDate: passwordRevisionDate.toISOString(),
        totp: "myTotp",
      });

      expect(actual).toEqual({
        uris: ["loginUri1_fromJSON", "loginUri2_fromJSON"] as any,
        username: { encryptedString: "myUsername", encryptionType: 0 },
        password: { encryptedString: "myPassword", encryptionType: 0 },
        passwordRevisionDate: passwordRevisionDate,
        totp: { encryptedString: "myTotp", encryptionType: 0 },
      });
      expect(actual).toBeInstanceOf(Login);
    });

    it("returns null if object is null", () => {
      expect(Login.fromJSON(null)).toBeNull();
    });
  });
});
