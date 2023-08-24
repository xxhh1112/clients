import { noopInitialize, recordInitialize } from "@bitwarden/common/platform/misc/initializers";

import { Account } from "../../../models/account";
import { BrowserStateService } from "../../services/browser-state.service";
import { ForegroundBitSubject } from "../../utils/foreground-bit-subject";

export class ForegroundStateService extends BrowserStateService {
  protected accountsSubject = new ForegroundBitSubject<{ [userId: string]: Account }>(
    "stateService_accounts",
    recordInitialize<Account>(Account.fromJSON)
  );

  protected activeAccountSubject = new ForegroundBitSubject<string>(
    "stateService_activeAccount",
    noopInitialize
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
