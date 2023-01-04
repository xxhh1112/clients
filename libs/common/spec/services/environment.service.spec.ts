import { MockProxy, mock } from "jest-mock-extended";
import { Subject } from "rxjs";

import { AccountData } from "../../src/abstractions/account/account.service";
import { SubjectData } from "../../src/misc/subject-data";
import { AccountServiceImplementation } from "../../src/services/account/account.service";
import { EnvironmentService } from "../../src/services/environment.service";
import { StateService } from "../../src/services/state.service";
import { awaitAsync } from "../../test-utils";

describe("EnvironmentService", () => {
  let sut: EnvironmentService;
  let stateService: MockProxy<StateService>;
  let accountService: MockProxy<AccountServiceImplementation>;
  let activeAccount: Subject<SubjectData<AccountData>>;

  beforeEach(() => {
    stateService = mock();
    accountService = mock();
    activeAccount = new Subject();
    accountService.activeAccount$ = activeAccount;
    sut = new EnvironmentService(stateService, accountService);
  });

  afterEach(() => {
    activeAccount.complete();
  });

  it("sets urls when active account is changed", async () => {
    const spy = jest.spyOn(sut, "setUrlsFromStorage").mockImplementation();

    await awaitAsync();
    expect(spy).not.toHaveBeenCalled();
    activeAccount.next(SubjectData.loaded({ id: "", unlocked: false }));
    await awaitAsync();
    expect(spy).toHaveBeenCalled();
  });
});
