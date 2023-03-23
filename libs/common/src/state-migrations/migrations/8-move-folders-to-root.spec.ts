import { MockProxy } from "jest-mock-extended";

import { MigrationHelper } from "../migration-helper";
import { mockMigrationHelper } from "../migration-helper.spec";

import { MoveFoldersToRootMigrator } from "./8-move-folders-to-root";

function migrateExampleJSON() {
  return {
    global: {
      stateVersion: 7,
      otherStuff: "otherStuff",
    },
    authenticatedAccounts: [
      "c493ed01-4e08-4e88-abc7-332f380ca760",
      "23e61a5f-2ece-4f5e-b499-f0bc489482a9",
    ],
    "c493ed01-4e08-4e88-abc7-332f380ca760": {
      data: {
        otherStuff: "otherStuff",
        folders: {
          encrypted: {
            folderId1: {
              id: "folderId1",
              name: "encName",
              revisionDate: "revisionDateISOString",
            },
            folderId2: {
              id: "folderId2",
              name: "encName2",
              revisionDate: "revisionDateISOString2",
            },
          },
        },
      },
      otherStuff: "otherStuff",
    },
  };
}

function rollbackExampleJSON() {
  return {
    global: {
      stateVersion: 8,
      otherStuff: "otherStuff",
    },
    authenticatedAccounts: [
      "c493ed01-4e08-4e88-abc7-332f380ca760",
      "23e61a5f-2ece-4f5e-b499-f0bc489482a9",
    ],
    "account.c493ed01-4e08-4e88-abc7-332f380ca760.folder.folders": {
      folderId1: {
        id: "folderId1",
        name: "encName",
        revisionDate: "revisionDateISOString",
      },
      folderId2: {
        id: "folderId2",
        name: "encName2",
        revisionDate: "revisionDateISOString2",
      },
    },
    "c493ed01-4e08-4e88-abc7-332f380ca760": {
      data: {
        otherStuff: "otherStuff",
      },
      otherStuff: "otherStuff",
    },
  };
}

describe("MoveFoldersToRootMigrator", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: MoveFoldersToRootMigrator;

  beforeEach(() => {
    sut = new MoveFoldersToRootMigrator(7, 8);
  });

  describe("migrate", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(migrateExampleJSON());
    });

    it("should move folders to root", async () => {
      await sut.migrate(helper);

      expect(helper.set).toHaveBeenCalledWith(
        "account.c493ed01-4e08-4e88-abc7-332f380ca760.folder.folders",
        migrateExampleJSON()["c493ed01-4e08-4e88-abc7-332f380ca760"].data.folders.encrypted
      );
      expect(helper.set).toHaveBeenLastCalledWith(
        "c493ed01-4e08-4e88-abc7-332f380ca760",
        rollbackExampleJSON()["c493ed01-4e08-4e88-abc7-332f380ca760"]
      );
      expect(helper.set).toHaveBeenCalledTimes(2);
    });
  });

  describe("rollback", () => {
    beforeEach(() => {
      helper = mockMigrationHelper(rollbackExampleJSON());
    });

    it("should move folders back to account", async () => {
      await sut.rollback(helper);

      expect(helper.set).toHaveBeenCalledWith(
        "c493ed01-4e08-4e88-abc7-332f380ca760",
        migrateExampleJSON()["c493ed01-4e08-4e88-abc7-332f380ca760"]
      );
      expect(helper.remove).toHaveBeenCalledWith(
        "account.c493ed01-4e08-4e88-abc7-332f380ca760.folder.folders"
      );
      expect(helper.set).toHaveBeenCalledTimes(1);
      expect(helper.remove).toHaveBeenCalledTimes(1);
    });
  });
});
