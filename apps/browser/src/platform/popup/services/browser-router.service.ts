import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { concatMap, filter } from "rxjs";

import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

@Injectable({
  providedIn: "root",
})
export class BrowserRouterService {
  constructor(router: Router, private stateService: StateService) {
    router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        concatMap((e: NavigationEnd) => stateService.setPreviousUrl(e.url))
      )
      .subscribe();
  }

  async getPreviousUrl() {
    return this.stateService.getPreviousUrl();
  }

  // Check validity of previous url
  async hasPreviousUrl() {
    return (await this.getPreviousUrl()) != "/";
  }
}
