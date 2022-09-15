import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { switchMap, takeUntil } from "rxjs/operators";

import { SecretResponse } from "./responses/secret.response";
import { SecretApiService } from "./secret-api.service";

@Component({
  selector: "sm-secrets",
  templateUrl: "./secrets.component.html",
})
export class SecretsComponent implements OnInit, OnDestroy {
  private organizationId: string;
  private destroy$ = new Subject<void>();

  secrets: SecretResponse[];

  constructor(private route: ActivatedRoute, private secretsApiService: SecretApiService) {}

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap(async (params) => {
          this.organizationId = params.organizationId;
          await this.getSecrets();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async getSecrets() {
    this.secrets = (
      await this.secretsApiService.getSecretsByOrganizationId(this.organizationId)
    ).data;
  }
}
