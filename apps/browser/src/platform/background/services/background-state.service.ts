import { noopInitialize, recordInitialize } from "@bitwarden/common/platform/misc/initializers";
import { GlobalState } from "@bitwarden/common/platform/models/domain/global-state";
import { State } from "@bitwarden/common/platform/models/domain/state";

import { Account } from "../../../models/account";
import { BrowserStateService } from "../../services/browser-state.service";
import { BackgroundBitSubject } from "../../utils/background-bit-subject";

export class BackgroundStateService extends BrowserStateService {
  protected sharedMemoryState$ = new BackgroundBitSubject<State<GlobalState, Account>>(
    "stateService_sharedMemoryState",
    State.deserializerWith<GlobalState, Account>(this.accountDeserializer)
  );
  protected activeAccountSubject = new BackgroundBitSubject<string>(
    "stateService_activeAccount",
    noopInitialize
  );

  protected activeAccountUnlockedSubject = new BackgroundBitSubject<boolean>(
    "stateService_activeAccountUnlocked",
    noopInitialize
  );

  protected accountDiskCache = new BackgroundBitSubject<Record<string, Account>>(
    "stateService_accountDiskCache",
    recordInitialize<Account>(Account.fromJSON)
  );
}
