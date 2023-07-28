import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

@Injectable()
export class RouterService {
  private previousUrl: string = undefined;
  private currentUrl: string = undefined;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private stateService: StateService,
    i18nService: I18nService
  ) {
    this.currentUrl = this.router.url;

    router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.url;

        let title = i18nService.t("bitWebVault");

        if (this.currentUrl.includes("/sm/")) {
          title = i18nService.t("bitSecretsManager");
        }

        let child = this.activatedRoute.firstChild;
        while (child.firstChild) {
          child = child.firstChild;
        }

        const titleId: string = child?.snapshot?.data?.titleId;
        const rawTitle: string = child?.snapshot?.data?.title;
        const updateUrl = !child?.snapshot?.data?.doNotSaveUrl ?? true;

        if (titleId != null || rawTitle != null) {
          const newTitle = rawTitle != null ? rawTitle : i18nService.t(titleId);
          if (newTitle != null && newTitle !== "") {
            title = newTitle + " | " + title;
          }
        }
        this.titleService.setTitle(title);
        if (updateUrl) {
          this.setPreviousUrl(this.currentUrl);
        }
      });
  }

  getPreviousUrl(): string {
    return this.previousUrl;
  }

  setPreviousUrl(url: string): void {
    this.previousUrl = url;
  }

  /**
   * Save URL to Global State. This service should only be used when there is navigation that
   * causes the App to be destroyed, ie: SSO routing to IdP.
   * @param url URL being saved to the Global State
   */
  async persistPreviousUrl(): Promise<void> {
    await this.stateService.setPreviousUrl(this.previousUrl);
  }

  /**
   * Set GlobalState.PreviousUrl to null
   */
  async clearPersistedUrl(): Promise<void> {
    await this.stateService.setPreviousUrl(null);
  }

  /**
   * Fetch GlobalState.PreviousUrl
   * @returns GlobalState.PreviousUrl
   */
  async getPersistedUrl(): Promise<string> {
    return await this.stateService.getPreviousUrl();
  }
}
