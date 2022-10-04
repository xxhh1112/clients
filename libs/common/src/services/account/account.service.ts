import { BehaviorSubject, Subject } from "rxjs";

import { InternalAccountService } from "../../abstractions/account/account.service";
import { LogService } from "../../abstractions/log.service";
import { MessagingService } from "../../abstractions/messaging.service";
import { AuthenticationStatus } from "../../enums/authenticationStatus";

export class AccountServiceImplementation implements InternalAccountService {
  private accounts = new BehaviorSubject<Map<string, AuthenticationStatus>>(new Map());
  private activeAccount = new BehaviorSubject<string | undefined>(undefined);
  private lock = new Subject<string>();
  private logout = new Subject<string>();

  accounts$ = this.accounts.asObservable();
  activeAccount$ = this.activeAccount.asObservable();
  accountLocked$ = this.lock.asObservable();
  accountLogout$ = this.logout.asObservable();

  constructor(private messagingService: MessagingService, private logService: LogService) {}

  setAccountStatus(userId: string, status: AuthenticationStatus) {
    this.accounts.value.set(userId, status);
    this.accounts.next(this.accounts.value);
    if (status === AuthenticationStatus.LoggedOut) {
      this.logout.next(userId);
    } else if (status === AuthenticationStatus.Locked) {
      this.lock.next(userId);
    }
  }

  switchAccount(userId: string) {
    if (!this.accounts.value.has(userId)) {
      throw new Error("Account does not exist");
    }
    this.activeAccount.next(userId);
  }

  delete(): void {
    try {
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
