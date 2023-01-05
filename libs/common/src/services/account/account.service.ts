import { BehaviorSubject, combineLatestWith, distinctUntilChanged, filter, map } from "rxjs";
import { SetRequired } from "type-fest";

import {
  AccountData,
  ACCOUNT_DEFAULTS,
  InternalAccountService,
} from "../../abstractions/account/account.service";
import { LogService } from "../../abstractions/log.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { SubjectData } from "../../misc/subject-data";

export class AccountServiceImplementation implements InternalAccountService {
  private _accounts: BehaviorSubject<SubjectData<SubjectData<AccountData>[]>> = new BehaviorSubject(
    SubjectData.loading([])
  );
  private _lastAccountHash = this._accounts.value.hash;

  private _activeAccount: BehaviorSubject<string | undefined> = new BehaviorSubject(undefined);
  private _lastActiveAccountHash = "";

  accounts$ = this._accounts.pipe(
    distinctUntilChanged((_, curr) => {
      if (curr.hash === this._lastAccountHash) {
        return true;
      } else {
        this._lastAccountHash = curr.hash;
        return false;
      }
    })
  );
  activeAccount$ = this._accounts.pipe(
    filter((accounts) => accounts.loaded),
    combineLatestWith(this._activeAccount),
    map(([accounts, activeAccount]) =>
      accounts.data.find((a) => a?.data?.id != null && a.data.id === activeAccount)
    ),
    distinctUntilChanged((_, curr) => {
      if (curr.hash === this._lastActiveAccountHash) {
        return true;
      } else {
        this._lastActiveAccountHash = curr.hash;
        return false;
      }
    })
  );
  activeAccountUnlocked$ = this.activeAccount$.pipe(
    filter((account) => account?.loaded),
    map((account) => account?.data?.unlocked)
  );

  constructor(private messagingService: MessagingService, private logService: LogService) {
    (self as any).services ||= {};
    (self as any).services.accountServices ||= [];
    (self as any).services.accountServices.push(this);
  }

  async delete(): Promise<void> {
    try {
      this.messagingService.send("logout");
    } catch (e) {
      this.logService.error(e);
      throw e;
    }
  }

  setActiveAccount(account: string): void {
    this._activeAccount.next(account);
  }

  upsertAccount(
    account: SetRequired<Partial<AccountData>, "id">,
    loaded: boolean | null = null
  ): void {
    if (account?.id == null) {
      return;
    }

    const existing = this._accounts.value?.data?.find((a) => a?.data?.id === account.id);
    const newAccount = { ...ACCOUNT_DEFAULTS, ...(existing?.data ?? {}), ...account };

    if (existing == null) {
      this.addAccount(newAccount);
      return;
    }

    loaded = loaded ?? existing?.loaded;
    const accounts = this._accounts.value.data || [];

    const accountData = loaded ? SubjectData.loaded(newAccount) : SubjectData.loading(newAccount);
    const newAccounts = accounts?.map((a) => {
      return a.data.id === newAccount.id ? accountData : a;
    });
    this._accounts.next(this._accounts.value.update(newAccounts));
  }

  setAccountsListLoaded(loaded: boolean) {
    this._accounts.next(
      loaded
        ? SubjectData.loaded(this._accounts.value.data)
        : SubjectData.loading(this._accounts.value.data)
    );
  }

  setAccountLoaded(userId: string, loaded: boolean) {
    const accounts = this._accounts.value.data;
    const newAccounts = accounts.map((a) => {
      return a.data.id === userId
        ? loaded
          ? SubjectData.loaded(a.data)
          : SubjectData.loading(a.data)
        : a;
    });
    this._accounts.next(this._accounts.value.update(newAccounts));
  }

  removeAccount(account: string): void {
    const accounts = this._accounts.value.data;
    const newAccounts = accounts.filter((a) => a.data.id !== account);
    if (newAccounts.length !== accounts.length) {
      this._accounts.next(this._accounts.value.update(newAccounts));
    }
  }

  private addAccount(account: AccountData): void {
    if (account == null || account?.id == null) {
      return;
    }

    if (this._accounts.value?.data?.find((a) => a?.data?.id === account.id) != null) {
      throw new Error("Account already exists");
    }

    const accounts = [...this._accounts.value.data] || [];
    accounts.push(SubjectData.loading(account));
    this._accounts.next(this._accounts.value.update(accounts));
  }
}
