import { animate, state, style, transition, trigger } from "@angular/animations";
import { ConnectedPosition } from "@angular/cdk/overlay";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { concatMap, Subject, takeUntil, filter, map } from "rxjs";

import {
  AccountData,
  AccountService,
} from "@bitwarden/common/abstractions/account/account.service";
import { AuthService } from "@bitwarden/common/abstractions/auth.service";
import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { TokenService } from "@bitwarden/common/abstractions/token.service";
import { AuthenticationStatus } from "@bitwarden/common/enums/authenticationStatus";
import { Utils } from "@bitwarden/common/misc/utils";
import { EnvironmentUrls } from "@bitwarden/common/models/domain/environment-urls";

type ActiveAccount = {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
};

export class SwitcherAccount {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public environmentUrls: EnvironmentUrls,
    public authenticationStatus: AuthenticationStatus,
    public avatarColor: string
  ) {}
  get serverUrl() {
    return this.removeWebProtocolFromString(
      this.environmentUrls?.base ?? this.environmentUrls?.api ?? "https://bitwarden.com"
    );
  }

  private removeWebProtocolFromString(urlString: string) {
    const regex = /http(s)?(:)?(\/\/)?|(\/\/)?(www\.)?/g;
    return urlString.replace(regex, "");
  }
}

@Component({
  selector: "app-account-switcher",
  templateUrl: "account-switcher.component.html",
  animations: [
    trigger("transformPanel", [
      state(
        "void",
        style({
          opacity: 0,
        })
      ),
      transition(
        "void => open",
        animate(
          "100ms linear",
          style({
            opacity: 1,
          })
        )
      ),
      transition("* => void", animate("100ms linear", style({ opacity: 0 }))),
    ]),
  ],
})
export class AccountSwitcherComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isOpen = false;
  accounts: { [userId: string]: SwitcherAccount } = {};
  activeAccount?: ActiveAccount;
  serverUrl: string;
  authStatus = AuthenticationStatus;
  overlayPostition: ConnectedPosition[] = [
    {
      originX: "end",
      originY: "bottom",
      overlayX: "end",
      overlayY: "top",
    },
  ];

  get showSwitcher() {
    const userIsInAVault = !Utils.isNullOrWhitespace(this.activeAccount?.email);
    const userIsAddingAnAdditionalAccount = Object.keys(this.accounts).length > 0;
    return userIsInAVault || userIsAddingAnAdditionalAccount;
  }

  get numberOfAccounts() {
    if (this.accounts == null) {
      this.isOpen = false;
      return 0;
    }
    return Object.keys(this.accounts).length;
  }

  constructor(
    private stateService: StateService,
    private authService: AuthService,
    private messagingService: MessagingService,
    private accountService: AccountService,
    private router: Router,
    private tokenService: TokenService
  ) {}

  async ngOnInit(): Promise<void> {
    this.accountService.accounts$
      .pipe(
        filter((accounts) => accounts.loaded),
        map((accounts) =>
          accounts.data.filter((account) => account.loaded).map((account) => account.data)
        ),
        concatMap(async (accounts) => {
          this.accounts = await this.createSwitcherAccounts(accounts);
          try {
            this.activeAccount = {
              id: await this.tokenService.getUserId(),
              name: (await this.tokenService.getName()) ?? (await this.tokenService.getEmail()),
              email: await this.tokenService.getEmail(),
              avatarColor: await this.stateService.getAvatarColor(),
            };
          } catch {
            this.activeAccount = undefined;
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  close() {
    this.isOpen = false;
  }

  async switch(userId: string) {
    this.close();

    this.messagingService.send("switchAccount", { userId: userId });
  }

  async addAccount() {
    this.close();
    await this.stateService.setActiveUser(null);
    await this.stateService.setRememberedEmail(null);
    this.router.navigate(["/login"]);
  }

  private async createSwitcherAccounts(
    accounts: AccountData[]
  ): Promise<{ [userId: string]: SwitcherAccount }> {
    const switcherAccounts = await Promise.all(
      accounts.map(async (account) => {
        const environmentUrls = await this.stateService.getEnvironmentUrls({ userId: account.id });
        const authStatus = await this.authService.getAuthStatus(account.id);
        const avatarColor = await this.stateService.getAvatarColor({ userId: account.id });
        return new SwitcherAccount(
          account.id,
          account.name,
          account.email,
          environmentUrls,
          authStatus,
          avatarColor
        );
      })
    );
    return Utils.arrayToRecord(switcherAccounts, "id");
  }
}
