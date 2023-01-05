import { Observable } from "rxjs";
import { SetOptional, SetRequired } from "type-fest";

import { SubjectData } from "../../misc/subject-data";

export type AccountData = {
  id: string;
  unlocked: boolean; // TODO MDG: auth service also provides a `getAccountStatus` method that checks more than this, we need to align on what to use. Current theory is that when handling login stuff, use auth service. Otherwise, use this.
  email: string;
  name?: string;
};

export const ACCOUNT_DEFAULTS: SetOptional<AccountData, "id"> = {
  unlocked: false,
  email: "",
  name: "",
};

export abstract class AccountService {
  accounts$: Observable<SubjectData<SubjectData<AccountData>[]>>;
  activeAccount$: Observable<SubjectData<AccountData> | undefined>;
  activeAccountUnlocked$: Observable<boolean>;
}

export abstract class InternalAccountService extends AccountService {
  abstract delete(): void;
  abstract setActiveAccount(account: string): void;
  abstract setAccountsListLoaded(loaded: boolean): void;
  abstract setAccountLoaded(userId: string, loaded: boolean): void;
  /**
   * Update or insert an account. Updates are matched by account id. Inserts are fleshed out with ACCOUNT_DEFAULTS if not all are provided.
   * If provided, loaded state is set to the provided value. Otherwise, it is set to the existing value for updates and false for inserts.
   */
  abstract upsertAccount(
    account: SetRequired<Partial<AccountData>, "id">,
    loaded?: boolean | undefined
  ): void;
  abstract removeAccount(account: string): void;
}
