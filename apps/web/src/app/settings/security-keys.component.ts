import { Component, OnInit, ViewChild, ViewContainerRef } from "@angular/core";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { KeyConnectorService } from "@bitwarden/common/auth/abstractions/key-connector.service";
import { ApiKeyResponse } from "@bitwarden/common/auth/models/response/api-key.response";

import { BitwardenSdkService } from "../core/bitwarden-sdk.service";

import { ApiKeyComponent } from "./api-key.component";

@Component({
  selector: "app-security-keys",
  templateUrl: "security-keys.component.html",
})
export class SecurityKeysComponent implements OnInit {
  @ViewChild("viewUserApiKeyTemplate", { read: ViewContainerRef, static: true })
  viewUserApiKeyModalRef: ViewContainerRef;
  @ViewChild("rotateUserApiKeyTemplate", { read: ViewContainerRef, static: true })
  rotateUserApiKeyModalRef: ViewContainerRef;

  showChangeKdf = true;

  constructor(
    private keyConnectorService: KeyConnectorService,
    private stateService: StateService,
    private modalService: ModalService,
    private apiService: ApiService,
    private sdkService: BitwardenSdkService
  ) {}

  async ngOnInit() {
    this.showChangeKdf = !(await this.keyConnectorService.getUsesKeyConnector());
  }

  async viewUserApiKey() {
    const entityId = await this.stateService.getUserId();
    await this.modalService.openViewRef(ApiKeyComponent, this.viewUserApiKeyModalRef, (comp) => {
      comp.keyType = "user";
      comp.entityId = entityId;
      comp.postKey = async (entity, request) => {
        const client = await this.sdkService.getClient();
        const response = await client.getUserApiKey(
          request.masterPasswordHash ?? request.otp,
          request.otp != null
        );

        if (!response.success) {
          throw new Error(response.errorMessage);
        }

        const r = new ApiKeyResponse({});
        r.apiKey = response.data.apiKey;
        return r;
      };
      comp.scope = "api";
      comp.grantType = "client_credentials";
      comp.apiKeyTitle = "apiKey";
      comp.apiKeyWarning = "userApiKeyWarning";
      comp.apiKeyDescription = "userApiKeyDesc";
    });
  }

  async rotateUserApiKey() {
    const entityId = await this.stateService.getUserId();
    await this.modalService.openViewRef(ApiKeyComponent, this.rotateUserApiKeyModalRef, (comp) => {
      comp.keyType = "user";
      comp.isRotation = true;
      comp.entityId = entityId;
      comp.postKey = this.apiService.postUserRotateApiKey.bind(this.apiService);
      comp.scope = "api";
      comp.grantType = "client_credentials";
      comp.apiKeyTitle = "apiKey";
      comp.apiKeyWarning = "userApiKeyWarning";
      comp.apiKeyDescription = "apiKeyRotateDesc";
    });
  }
}
