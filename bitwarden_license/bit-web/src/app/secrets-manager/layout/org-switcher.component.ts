import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, map, Observable, of, switchMap } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import type { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

@Component({
  selector: "org-switcher",
  templateUrl: "org-switcher.component.html",
})
export class OrgSwitcherComponent {
  protected organizations$: Observable<Organization[]> =
    this.organizationService.organizations$.pipe(
      map((orgs) =>
        orgs
          .filter((org) => this.filter(org))
          .sort((a, b) => a.name.localeCompare(b.name))
          .sort((a, b) => (a.enabled ? -1 : 1))
      )
    );

  protected activeOrganization$: Observable<Organization> = combineLatest([
    this.route.paramMap,
    this.organizations$,
  ]).pipe(
    switchMap(([params, orgs]) => {
      const selectedOrg = orgs.find((org) => org.id === params.get("organizationId"));
      return of(selectedOrg);
    })
  );

  /**
   * Filter function for displayed organizations in the `org-switcher`
   * @example
   * const smFilter = (org: Organization) => org.canAccessSecretsManager
   * // <org-switcher [filter]="smFilter">
   */
  @Input()
  filter: (org: Organization) => boolean = () => true;

  /**
   * Is `true` if the expanded content is visible
   */
  @Input()
  open = false;
  @Output()
  openChange = new EventEmitter<boolean>();

  /**
   * Visibility of the New Organization button
   * (Temporary; will be removed when ability to create organizations is added to SM.)
   */
  @Input()
  hideNewButton = false;

  constructor(
    private route: ActivatedRoute,
    private organizationService: OrganizationService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService
  ) {}

  protected toggle(event?: MouseEvent) {
    event?.stopPropagation();
    this.open = !this.open;
    this.openChange.emit(this.open);
  }

  protected inactiveOrganizationError(event?: MouseEvent) {
    event?.stopPropagation();
    this.platformUtilsService.showToast(
      "error",
      null,
      this.i18nService.t("disabledOrganizationFilterError")
    );
  }
}
