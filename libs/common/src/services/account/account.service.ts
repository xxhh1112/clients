import { BehaviorSubject, filter, Subject } from "rxjs";

import { InternalAccountService } from "../../abstractions/account/account.service";
import { LogService } from "../../abstractions/log.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { AuthenticationStatus } from "../../enums/authenticationStatus";

export class AccountServiceImplementation implements InternalAccountService {
  private accounts = new BehaviorSubject<Map<string, AuthenticationStatus>>(new Map());
  private activeAccount = new BehaviorSubject<{
    id: string | undefined;
    status: AuthenticationStatus | undefined;
  }>({ id: undefined, status: undefined });
  private lock = new Subject<string>();
  private logout = new Subject<string>();
  private unlock = new Subject<string>();

  accounts$ = this.accounts.asObservable();
  activeAccount$ = this.activeAccount.asObservable();
  accountLocked$ = this.lock.asObservable();
  accountLogout$ = this.logout.asObservable();
  accountUnlocked$ = this.unlock.asObservable();

  activeAccountLocked$ = this.accountLocked$.pipe(
    filter((userId) => userId === this.activeAccount.value.id)
  );
  activeAccountUnlocked$ = this.accountUnlocked$.pipe(
    filter((userId) => userId === this.activeAccount.value.id)
  );
  activeAccountLogout$ = this.accountLogout$.pipe(
    filter((userId) => userId === this.activeAccount.value.id)
  );

  constructor(private messagingService: MessagingService, private logService: LogService) {}

  setAccountStatus(userId: string, status: AuthenticationStatus) {
    this.accounts.value.set(userId, status);
    this.accounts.next(this.accounts.value);
    if (status === AuthenticationStatus.LoggedOut) {
      this.logout.next(userId);
    } else if (status === AuthenticationStatus.Locked) {
      this.lock.next(userId);
    } else if (status === AuthenticationStatus.Unlocked) {
      this.unlock.next(userId);
    }
  }

  switchAccount(userId: string) {
    if (!this.accounts.value.has(userId)) {
      throw new Error("Account does not exist");
    }
    this.activeAccount.next({ id: userId, status: this.accounts.value.get(userId) });
  }

  delete(): void {
    try {
      this.logout.next(this.activeAccount.value.id);
      this.accounts.value.delete(this.activeAccount.value.id);
      this.accounts.next(this.accounts.value);
      this.messagingService.send("logout");
    } catch (e) {
      this.logService.error(e);
      throw e;
    }
  }

  complete() {
    this.accounts.complete();
    this.activeAccount.complete();
    this.lock.complete();
    this.logout.complete();
  }
}
