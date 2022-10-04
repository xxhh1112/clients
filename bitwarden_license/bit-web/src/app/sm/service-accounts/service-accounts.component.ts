import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { combineLatestWith, Observable, startWith, switchMap } from "rxjs";

import { ServiceAccountView } from "@bitwarden/common/models/view/service-account-view";

import { ServiceAccountService } from "./service-account.service";

@Component({
  selector: "sm-service-accounts",
  templateUrl: "./service-accounts.component.html",
})
export class ServiceAccountsComponent implements OnInit {
  serviceAccounts$: Observable<ServiceAccountView[]>;

  private organizationId: string;

  constructor(
    private route: ActivatedRoute,
    private serviceAccountService: ServiceAccountService
  ) {}

  ngOnInit() {
    this.serviceAccounts$ = this.serviceAccountService.serviceAccount$.pipe(
      startWith(null),
      combineLatestWith(this.route.params),
      switchMap(async ([_, params]) => {
        this.organizationId = params.organizationId;
        return await this.getServiceAccounts();
      })
    );
  }
  private async getServiceAccounts(): Promise<ServiceAccountView[]> {
    return await this.serviceAccountService.getServiceAccounts(this.organizationId);
  }
}
