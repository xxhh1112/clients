import { mockEnc } from "../../../spec/utils";
import { Password } from "../domain/password";

import { PasswordHistoryView } from "./password-history.view";

describe("PasswordHistoryView", () => {
  it("fromJSON initializes nested objects", () => {
    const lastUsedDate = new Date();

    const actual = PasswordHistoryView.fromJSON({
      lastUsedDate: lastUsedDate.toISOString(),
    });

    expect(actual.lastUsedDate).toEqual(lastUsedDate);
  });

  it("Decrypt", async () => {
    const password = new Password();
    password.password = mockEnc("password");
    password.lastUsedDate = new Date("2022-01-31T12:00:00.000Z");

    const view = await PasswordHistoryView.decrypt(null, null, password);

    expect(view).toEqual({
      password: "password",
      lastUsedDate: new Date("2022-01-31T12:00:00.000Z"),
    });
  });
});
