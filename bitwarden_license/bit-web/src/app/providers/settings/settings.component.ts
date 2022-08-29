import { Component, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { concatMap, Subject, takeUntil } from "rxjs";

import { ProviderService } from "@bitwarden/common/abstractions/provider.service";

@Component({
  selector: "provider-settings",
  templateUrl: "settings.component.html",
})
export class SettingsComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private providerService: ProviderService) {}

  ngOnInit() {
    this.route.params
      .pipe(
        concatMap(async (params) => {
          await this.providerService.get(params.providerId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
