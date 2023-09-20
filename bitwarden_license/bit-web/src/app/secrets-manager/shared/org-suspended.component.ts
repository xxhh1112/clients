import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { tap } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Icon, Icons } from "@bitwarden/components";

@Component({
  templateUrl: "./org-suspended.component.html",
})
export class OrgDisabledComponent implements OnInit {
  constructor(private organizationService: OrganizationService, private route: ActivatedRoute) {}

  protected organizationName: string;
  protected organizationId: string;
  protected NoAccess: Icon = Icons.NoAccess;

  async ngOnInit() {
    this.route.params.pipe(
      tap((params) => {
        this.organizationId = params.organizationId;
      })
    );

    this.organizationName = this.organizationService.get(this.organizationId)?.name;
  }
}
