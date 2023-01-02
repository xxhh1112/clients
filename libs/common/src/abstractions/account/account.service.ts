import { Observable } from "rxjs";

import { SubjectData } from "../../misc/subject-data";

export type AccountData = {
  id: string;
  unlocked: boolean;
};

export abstract class AccountService {
  accounts$: Observable<SubjectData<SubjectData<AccountData>[]>>;
  activeAccount$: Observable<SubjectData<AccountData>>;
  activeAccountUnlocked$: Observable<boolean>;
}

export abstract class InternalAccountService extends AccountService {
  abstract delete(): void;
  abstract setActiveAccount(account: string): void;
  abstract setAccountsListLoaded(loaded: boolean): void;
  abstract setAccountLoaded(userId: string, loaded: boolean): void;
  /** Upserts an account to the accounts observable. If the account already exists and loaded is null,
   *  the loaded value already in accounts$ is used. If the account is new, loaded is always set to false.
   *  This allows for an opportunity to do work on the loading account, if necessary*/
  abstract upsertAccount(account: AccountData, loaded?: boolean | undefined): void;
  abstract removeAccount(account: string): void;
}
