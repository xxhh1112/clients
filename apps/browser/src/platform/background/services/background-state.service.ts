import { noopInitialize, recordInitialize } from "@bitwarden/common/platform/misc/initializers";

import { Account } from "../../../models/account";
import { BrowserStateService } from "../../services/browser-state.service";
import { BackgroundBitSubject } from "../../utils/background-bit-subject";

export class BackgroundStateService extends BrowserStateService {
  protected accountsSubject = new BackgroundBitSubject<{ [userId: string]: Account }>(
    "stateService_accounts",
    recordInitialize<Account>(Account.fromJSON)
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
