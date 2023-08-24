import { noopInitialize, recordInitialize } from "@bitwarden/common/platform/misc/initializers";
import { GlobalState } from "@bitwarden/common/platform/models/domain/global-state";
import { State } from "@bitwarden/common/platform/models/domain/state";

import { Account } from "../../../models/account";
import { BrowserStateService } from "../../services/browser-state.service";
import { ForegroundBitSubject } from "../../utils/foreground-bit-subject";

export class ForegroundStateService extends BrowserStateService {
  protected sharedMemoryState$ = new ForegroundBitSubject<State<GlobalState, Account>>(
    "stateService_sharedMemoryState",
    State.deserializerWith<GlobalState, Account>(this.accountDeserializer)
  );
  protected activeAccountUnlockedSubject = new ForegroundBitSubject<boolean>(
    "stateService_activeAccountUnlocked",
    noopInitialize
  );

  protected accountDiskCache = new ForegroundBitSubject<Record<string, Account>>(
    "stateService_accountDiskCache",
    recordInitialize<Account>(Account.fromJSON)
  );
}
