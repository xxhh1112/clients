import { Component, Input } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, filter, map, Observable } from "rxjs";

import {
  AccountData,
  AccountService,
} from "@bitwarden/common/abstractions/account/account.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";

@Component({
  selector: "sm-header",
  templateUrl: "./header.component.html",
})
export class HeaderComponent {
  @Input() title: string;
  @Input() searchTitle: string;

  protected routeData$: Observable<{ title: string; searchTitle: string }>;
  protected account$: Observable<AccountData>;

  constructor(
    private route: ActivatedRoute,
    private stateService: StateService,
    private accountService: AccountService
  ) {
    this.routeData$ = this.route.data.pipe(
      map((params) => {
        return {
          title: params.title,
          searchTitle: params.searchTitle,
        };
      })
    );

    this.account$ = combineLatest([
      this.accountService.activeAccount$,
      this.accountService.accounts$.pipe(
        filter((accounts) => accounts.loaded),
        map((accounts) => accounts.data.map((account) => account?.data))
      ),
    ]).pipe(
      map(([activeAccount, accounts]) => {
        return accounts.find((account) => account?.id === activeAccount?.data?.id);
      })
    );
  }
}
