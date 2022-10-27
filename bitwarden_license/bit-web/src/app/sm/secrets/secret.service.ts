import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

import { AbstractEncryptService } from "@bitwarden/common/abstractions/abstractEncrypt.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { SecretWithProjectsListResponse } from "@bitwarden/common/models/response/secretWithProjectsListResponse";
import { ProjectsMappedToSecret } from "@bitwarden/common/models/view/projectsMappedToSecret";
import { SecretListView } from "@bitwarden/common/models/view/secretListView";
import { SecretView } from "@bitwarden/common/models/view/secretView";

import { SecretRequest } from "./requests/secret.request";
import { SecretListItemResponse } from "./responses/secret-list-item.response";
import { SecretResponse } from "./responses/secret.response";

@Injectable({
  providedIn: "root",
})
export class SecretService {
  protected _secret: Subject<SecretView> = new Subject();

  secret$ = this._secret.asObservable();

  constructor(
    private cryptoService: CryptoService,
    private apiService: ApiService,
    private encryptService: AbstractEncryptService
  ) {}

  async getBySecretId(secretId: string): Promise<SecretView> {
    const r = await this.apiService.send("GET", "/secrets/" + secretId, null, true, true);
    const secretResponse = new SecretResponse(r);
    return await this.createSecretView(secretResponse);
  }

  async getSecrets(organizationId: string): Promise<SecretListView[]> {
    const r = await this.apiService.send(
      "GET",
      "/organizations/" + organizationId + "/secrets",
      null,
      true,
      true
    );

    const results = new SecretWithProjectsListResponse(r, SecretListItemResponse);
    //results have all projects and secrets list
    return await this.createSecretsListView(organizationId, results.secrets, results.projects);
  }

  async create(organizationId: string, secretView: SecretView) {
    const request = await this.getSecretRequest(organizationId, secretView);
    const r = await this.apiService.send(
      "POST",
      "/organizations/" + organizationId + "/secrets",
      request,
      true,
      true
    );
    this._secret.next(await this.createSecretView(new SecretResponse(r)));
  }

  async update(organizationId: string, secretView: SecretView) {
    const request = await this.getSecretRequest(organizationId, secretView);
    const r = await this.apiService.send("PUT", "/secrets/" + secretView.id, request, true, true);
    this._secret.next(await this.createSecretView(new SecretResponse(r)));
  }

  async delete(secretIds: string[]) {
    const r = await this.apiService.send("POST", "/secrets/delete", secretIds, true, true);

    const responseErrors: string[] = [];
    r.data.forEach((element: { error: string }) => {
      if (element.error) {
        responseErrors.push(element.error);
      }
    });

    // TODO waiting to hear back on how to display multiple errors.
    // for now send as a list of strings to be displayed in toast.
    if (responseErrors?.length >= 1) {
      throw new Error(responseErrors.join(","));
    }

    this._secret.next(null);
  }

  private async getOrganizationKey(organizationId: string): Promise<SymmetricCryptoKey> {
    return await this.cryptoService.getOrgKey(organizationId);
  }

  private async getSecretRequest(
    organizationId: string,
    secretView: SecretView
  ): Promise<SecretRequest> {
    const orgKey = await this.getOrganizationKey(organizationId);
    const request = new SecretRequest();
    const [key, value, note] = await Promise.all([
      this.encryptService.encrypt(secretView.name, orgKey),
      this.encryptService.encrypt(secretView.value, orgKey),
      this.encryptService.encrypt(secretView.note, orgKey),
    ]);
    request.key = key.encryptedString;
    request.value = value.encryptedString;
    request.note = note.encryptedString;
    return request;
  }

  private async createSecretView(secretResponse: SecretResponse): Promise<SecretView> {
    const orgKey = await this.getOrganizationKey(secretResponse.organizationId);

    const secretView = new SecretView();
    secretView.id = secretResponse.id;
    secretView.organizationId = secretResponse.organizationId;
    secretView.creationDate = secretResponse.creationDate;
    secretView.revisionDate = secretResponse.revisionDate;

    const [name, value, note] = await Promise.all([
      this.encryptService.decryptToUtf8(new EncString(secretResponse.name), orgKey),
      this.encryptService.decryptToUtf8(new EncString(secretResponse.value), orgKey),
      this.encryptService.decryptToUtf8(new EncString(secretResponse.note), orgKey),
    ]);
    secretView.name = name;
    secretView.value = value;
    secretView.note = note;

    return secretView;
  }

  private async createSecretsListView(
    organizationId: string,
    secrets: SecretListItemResponse[],
    projects: ProjectsMappedToSecret[]
  ): Promise<SecretListView[]> {
    const orgKey = await this.getOrganizationKey(organizationId);
    return await Promise.all(
      secrets.map(async (s: SecretListItemResponse) => {
        const secretListView = new SecretListView();
        secretListView.id = s.id;
        secretListView.organizationId = s.organizationId;
        secretListView.name = await this.encryptService.decryptToUtf8(
          new EncString(s.name),
          orgKey
        );
        secretListView.creationDate = s.creationDate;
        secretListView.revisionDate = s.revisionDate;
        secretListView.projects = projects.filter((p) => s.projects.includes(p.id));
        return secretListView;
      })
    );
  }
}
