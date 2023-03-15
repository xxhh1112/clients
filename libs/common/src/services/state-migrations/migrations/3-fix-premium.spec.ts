import { MockProxy } from "jest-mock-extended";

import { TokenService } from "../../../auth/services/token.service";
import { MigrationHelper } from "../migration-helper";
import { mockMigrationHelper } from "../migration-helper.spec";

import { FixPremiumMigrator } from "./3-fix-premium";

const migrateExampleJSON = {
  authenticatedAccounts: [
    "c493ed01-4e08-4e88-abc7-332f380ca760",
    "23e61a5f-2ece-4f5e-b499-f0bc489482a9",
  ],
  "c493ed01-4e08-4e88-abc7-332f380ca760": {
    profile: {
      otherStuff: "otherStuff",
      hasPremiumPersonally: null as boolean,
    },
    tokens: {
      otherStuff: "otherStuff",
      accessToken: "accessToken",
    },
    otherStuff: "otherStuff",
  },
  "23e61a5f-2ece-4f5e-b499-f0bc489482a9": {
    profile: {
      otherStuff: "otherStuff",
      hasPremiumPersonally: true,
    },
    tokens: {
      otherStuff: "otherStuff",
      accessToken: "accessToken",
    },
    otherStuff: "otherStuff",
  },
  otherStuff: "otherStuff",
};

jest.mock("../../../auth/services/token.service", () => ({
  TokenService: {
    decodeToken: jest.fn(),
  },
}));

describe("FixPremiumMigrator", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: FixPremiumMigrator;
  const decodeTokenSpy = TokenService.decodeToken as jest.Mock;

  beforeEach(() => {
    helper = mockMigrationHelper(migrateExampleJSON);
    sut = new FixPremiumMigrator(2, 3);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("migrate", () => {
    it("should migrate hasPremiumPersonally", async () => {
      decodeTokenSpy.mockResolvedValueOnce({ premium: true });
      await sut.migrate(helper);

      expect(helper.set).toHaveBeenCalledTimes(1);
      expect(helper.set).toHaveBeenCalledWith("c493ed01-4e08-4e88-abc7-332f380ca760", {
        profile: {
          otherStuff: "otherStuff",
          hasPremiumPersonally: true,
        },
        tokens: {
          otherStuff: "otherStuff",
          accessToken: "accessToken",
        },
        otherStuff: "otherStuff",
      });
    });

    it("should not migrate if decode throws", async () => {
      decodeTokenSpy.mockRejectedValueOnce(new Error("test"));
      await sut.migrate(helper);

      expect(helper.set).not.toHaveBeenCalled();
    });

    it("should not migrate if decode returns null", async () => {
      decodeTokenSpy.mockResolvedValueOnce(null);
      await sut.migrate(helper);

      expect(helper.set).not.toHaveBeenCalled();
    });
  });
});
