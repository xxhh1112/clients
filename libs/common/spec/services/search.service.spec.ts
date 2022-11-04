import { mock, MockProxy } from "jest-mock-extended";
import { ReplaySubject } from "rxjs";

import { CipherService } from "../../src/abstractions/cipher.service";
import { I18nService } from "../../src/abstractions/i18n.service";
import { LogService } from "../../src/abstractions/log.service";
import { CollectionView } from "../../src/models/view/collection.view";
import { SearchService } from "../../src/services/search.service";

describe("SearchService", () => {
  let searchService: SearchService;

  let cipherService: MockProxy<CipherService>;
  let logService: MockProxy<LogService>;
  let i18nService: MockProxy<I18nService>;

  let locale: ReplaySubject<string>;

  beforeEach(() => {
    cipherService = mock<CipherService>();
    logService = mock<LogService>();
    i18nService = mock<I18nService>();

    locale = new ReplaySubject<string>(1);
    i18nService.locale$ = locale;

    searchService = new SearchService(cipherService, logService, i18nService);
  });

  describe("searchBasic", () => {
    const collectionList = [
      createCollectionView("C1 Id", "Collection 1", "org test id"),
      createCollectionView("C2 Id", "Collection 1/Collection 2", "org test id"),
      createCollectionView("C3 Id", "Collection 1/Collection 3", "org test id"),
      createCollectionView("C4", "Example Collection", "not really org test id"),
    ];

    it("filters by passed properties", () => {
      const result = searchService.searchBasic(
        collectionList,
        "C3",
        "name",
        "id",
        "organizationId"
      );
      expect(result).toEqual([collectionList[2]]);
    });

    it("checks all passed properties ", async () => {
      const result = searchService.searchBasic(
        collectionList,
        "id",
        "name",
        "id",
        "organizationId"
      );
      expect(result).toEqual(collectionList);
    });
  });

  function createCollectionView(id: string, name: string, orgId: string): CollectionView {
    const collection = new CollectionView();
    collection.id = id;
    collection.name = name;
    collection.organizationId = orgId;
    return collection;
  }
});
