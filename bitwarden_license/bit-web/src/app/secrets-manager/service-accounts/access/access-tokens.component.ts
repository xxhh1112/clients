import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, switchMap } from "rxjs";

import { ServiceAccountService } from "../service-account.service";

@Component({
  selector: "sm-access-tokens",
  templateUrl: "./access-tokens.component.html",
})
export class AccessTokenComponent implements OnInit {
  accessTokens$: Observable<any[]>;

  constructor(
    private route: ActivatedRoute,
    private serviceAccountService: ServiceAccountService
  ) {}

  ngOnInit() {
    this.accessTokens$ = this.route.params.pipe(
      switchMap(async (params) => {
        return await this.serviceAccountService.getAccessTokens(
          params.organizationId,
          params.serviceAccountId
        );
      })
    );
  }

  openNewAccessTokenDialog() {
    // TODO
  }
}
