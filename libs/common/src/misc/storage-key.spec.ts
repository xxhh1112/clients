import { Guid } from "../types/guid";

import { storageKey } from "./storage-key";

describe("storageKey", () => {
  it("should create a global key", () => {
    const key = storageKey("global", "serviceKey", "itemKey");
    expect(key).toBe("global.serviceKey.itemKey");
  });

  it("should create a scoped key", () => {
    const key = storageKey(["account", "guid" as Guid], "serviceKey", "itemKey");
    expect(key).toBe("account.guid.serviceKey.itemKey");
  });
});
