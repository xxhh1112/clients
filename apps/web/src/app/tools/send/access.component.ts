import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { SEND_KDF_ITERATIONS } from "@bitwarden/common/enums";
import { ErrorResponse } from "@bitwarden/common/models/response/error.response";
import { CryptoFunctionService } from "@bitwarden/common/platform/abstractions/crypto-function.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { SymmetricCryptoKey } from "@bitwarden/common/platform/models/domain/symmetric-crypto-key";
import { SendType } from "@bitwarden/common/tools/send/enums/send-type";
import { SendAccess } from "@bitwarden/common/tools/send/models/domain/send-access";
import { SendAccessRequest } from "@bitwarden/common/tools/send/models/request/send-access.request";
import { SendAccessResponse } from "@bitwarden/common/tools/send/models/response/send-access.response";
import { SendAccessView } from "@bitwarden/common/tools/send/models/view/send-access.view";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import { NoItemsModule } from "@bitwarden/components";

import { LooseComponentsModule, SharedModule } from "../../shared";

import { ExpiredSend } from "./icons/expired-send.icon";
import { SendAccessFileComponent } from "./send-access-file.component";
import { SendAccessPasswordComponent } from "./send-access-password.component";
import { SendAccessTextComponent } from "./send-access-text.component";

@Component({
  selector: "app-send-access",
  templateUrl: "access.component.html",
  standalone: true,
  imports: [
    SendAccessFileComponent,
    LooseComponentsModule,
    SendAccessTextComponent,
    SendAccessPasswordComponent,
    SharedModule,
    NoItemsModule,
  ],
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class AccessComponent implements OnInit {
  send: SendAccessView;
  sendType = SendType;
  loading = true;
  passwordRequired = false;
  formPromise: Promise<SendAccessResponse>;
  password: string;
  unavailable = false;
  error = false;
  hideEmail = false;

  private id: string;
  private key: string;
  decKey: SymmetricCryptoKey;
  accessRequest: SendAccessRequest;
  expiredSendIcon = ExpiredSend;

  constructor(
    private i18nService: I18nService,
    private cryptoFunctionService: CryptoFunctionService,
    private platformUtilsService: PlatformUtilsService,
    private route: ActivatedRoute,
    private cryptoService: CryptoService,
    private sendApiService: SendApiService
  ) {}

  get expirationDate() {
    if (this.send == null || this.send.expirationDate == null) {
      return null;
    }
    return this.send.expirationDate;
  }

  get creatorIdentifier() {
    if (this.send == null || this.send.creatorIdentifier == null) {
      return null;
    }
    return this.send.creatorIdentifier;
  }

  ngOnInit() {
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
    this.route.params.subscribe(async (params) => {
      this.id = params.sendId;
      this.key = params.key;
      if (this.key == null || this.id == null) {
        return;
      }
      await this.load();
    });
  }

  copyText() {
    this.platformUtilsService.copyToClipboard(this.send.text.text);
    this.platformUtilsService.showToast(
      "success",
      null,
      this.i18nService.t("valueCopied", this.i18nService.t("sendTypeText"))
    );
  }

  async load() {
    this.unavailable = false;
    this.error = false;
    this.hideEmail = false;
    try {
      const keyArray = Utils.fromUrlB64ToArray(this.key);
      this.accessRequest = new SendAccessRequest();
      if (this.password != null) {
        const passwordHash = await this.cryptoFunctionService.pbkdf2(
          this.password,
          keyArray,
          "sha256",
          SEND_KDF_ITERATIONS
        );
        this.accessRequest.password = Utils.fromBufferToB64(passwordHash);
      }
      let sendResponse: SendAccessResponse = null;
      if (this.loading) {
        sendResponse = await this.sendApiService.postSendAccess(this.id, this.accessRequest);
      } else {
        this.formPromise = this.sendApiService.postSendAccess(this.id, this.accessRequest);
        sendResponse = await this.formPromise;
      }
      this.passwordRequired = false;
      const sendAccess = new SendAccess(sendResponse);
      this.decKey = await this.cryptoService.makeSendKey(keyArray);
      this.send = await sendAccess.decrypt(this.decKey);
    } catch (e) {
      if (e instanceof ErrorResponse) {
        if (e.statusCode === 401) {
          this.passwordRequired = true;
        } else if (e.statusCode === 404) {
          this.unavailable = true;
        } else {
          this.error = true;
        }
      } else {
        this.error = true;
      }
    }
    this.loading = false;
    this.hideEmail =
      this.creatorIdentifier == null &&
      !this.passwordRequired &&
      !this.loading &&
      !this.unavailable;
  }
  getPassword(password: string) {
    this.password = password;
  }
}
