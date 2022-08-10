import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { SecretResponse } from "./responses/secret.response";
import { SecretApiService } from "./secret-api.service";

@Component({
  selector: "sm-secrets",
  templateUrl: "./secrets.component.html",
})
export class SecretsComponent implements OnInit {
  private organizationId: string;

  secrets: SecretResponse[];

  constructor(private route: ActivatedRoute, private secretsApiService: SecretApiService) {}

  ngOnInit() {
    this.route.params.subscribe(async (params: any) => {
      this.organizationId = params.organizationId;
      await this.getSecrets();
    });
  }

  private async getSecrets() {
    this.secrets = (
      await this.secretsApiService.getSecretsByOrganizationId(this.organizationId)
    ).data;
  }
}
