import { Location } from "@angular/common";
import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { first, takeUntil } from "rxjs/operators";

import { AddEditComponent as BaseAddEditComponent } from "@bitwarden/angular/vault/components/add-edit.component";
import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { EventCollectionService } from "@bitwarden/common/abstractions/event/event-collection.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { PasswordRepromptService } from "@bitwarden/common/vault/abstractions/password-reprompt.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { LoginUriView } from "@bitwarden/common/vault/models/view/login-uri.view";
import { DialogService } from "@bitwarden/components";

import { BrowserApi } from "../../../../platform/browser/browser-api";
import { PopupUtilsService } from "../../../../popup/services/popup-utils.service";
import { BrowserFido2UserInterfaceSession } from "../../../fido2/browser-fido2-user-interface.service";

@Component({
  selector: "app-vault-add-edit",
  templateUrl: "add-edit.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class AddEditComponent extends BaseAddEditComponent {
  currentUris: string[];
  showAttachments = true;
  openAttachmentsInPopup: boolean;
  showAutoFillOnPageLoadOptions: boolean;
  inPopout = false;
  senderTabId?: number;
  uilocation?: "popout" | "popup" | "sidebar" | "tab";
  // uniquely identifies a passkey's popout window
  sessionId?: string;

  constructor(
    cipherService: CipherService,
    folderService: FolderService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    auditService: AuditService,
    stateService: StateService,
    collectionService: CollectionService,
    messagingService: MessagingService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    eventCollectionService: EventCollectionService,
    policyService: PolicyService,
    private popupUtilsService: PopupUtilsService,
    organizationService: OrganizationService,
    passwordRepromptService: PasswordRepromptService,
    logService: LogService,
    sendApiService: SendApiService,
    dialogService: DialogService
  ) {
    super(
      cipherService,
      folderService,
      i18nService,
      platformUtilsService,
      auditService,
      stateService,
      collectionService,
      messagingService,
      eventCollectionService,
      policyService,
      logService,
      passwordRepromptService,
      organizationService,
      sendApiService,
      dialogService
    );
  }

  async ngOnInit() {
    await super.ngOnInit();

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.senderTabId = parseInt(value?.senderTabId, 10) || undefined;
      this.uilocation = value?.uilocation;
      this.sessionId = value?.sessionId;
    });

    this.inPopout = this.uilocation === "popout" || this.popupUtilsService.inPopout(window);

    // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
    this.route.queryParams.pipe(first()).subscribe(async (params) => {
      if (params.cipherId) {
        this.cipherId = params.cipherId;
      }
      if (params.folderId) {
        this.folderId = params.folderId;
      }
      if (params.collectionId) {
        const collection = this.writeableCollections.find((c) => c.id === params.collectionId);
        if (collection != null) {
          this.collectionIds = [collection.id];
          this.organizationId = collection.organizationId;
        }
      }
      if (params.type) {
        const type = parseInt(params.type, null);
        this.type = type;
      }
      this.editMode = !params.cipherId;

      if (params.cloneMode != null) {
        this.cloneMode = params.cloneMode === "true";
      }
      if (params.selectedVault) {
        this.organizationId = params.selectedVault;
      }
      await this.load();

      if (!this.editMode || this.cloneMode) {
        if (
          !this.popupUtilsService.inPopout(window) &&
          params.name &&
          (this.cipher.name == null || this.cipher.name === "")
        ) {
          this.cipher.name = params.name;
        }
        if (
          !this.popupUtilsService.inPopout(window) &&
          params.uri &&
          (this.cipher.login.uris[0].uri == null || this.cipher.login.uris[0].uri === "")
        ) {
          this.cipher.login.uris[0].uri = params.uri;
        }
      }

      this.openAttachmentsInPopup = this.popupUtilsService.inPopup(window);
    });

    if (!this.editMode) {
      const tabs = await BrowserApi.tabsQuery({ windowType: "normal" });
      this.currentUris =
        tabs == null
          ? null
          : tabs.filter((tab) => tab.url != null && tab.url !== "").map((tab) => tab.url);
    }

    this.setFocus();

    if (this.popupUtilsService.inTab(window)) {
      this.popupUtilsService.enableCloseTabWarning();
    }
  }

  async load() {
    await super.load();
    this.showAutoFillOnPageLoadOptions =
      this.cipher.type === CipherType.Login &&
      (await this.stateService.getEnableAutoFillOnPageLoad());
  }

  async submit(): Promise<boolean> {
    const success = await super.submit();
    if (!success) {
      return false;
    }

    if (this.inPopout && this.sessionId) {
      this.abortFido2Popout();
    }

    if (this.popupUtilsService.inTab(window)) {
      this.popupUtilsService.disableCloseTabWarning();
      this.messagingService.send("closeTab", { delay: 1000 });
      return true;
    }

    if (this.cloneMode) {
      this.router.navigate(["/tabs/vault"]);
    } else {
      this.location.back();
    }
    return true;
  }

  attachments() {
    super.attachments();

    if (this.openAttachmentsInPopup) {
      const destinationUrl = this.router
        .createUrlTree(["/attachments"], { queryParams: { cipherId: this.cipher.id } })
        .toString();
      const currentBaseUrl = window.location.href.replace(this.router.url, "");
      this.popupUtilsService.popOut(window, currentBaseUrl + destinationUrl);
    } else {
      this.router.navigate(["/attachments"], { queryParams: { cipherId: this.cipher.id } });
    }
  }

  editCollections() {
    super.editCollections();
    if (this.cipher.organizationId != null) {
      this.router.navigate(["/collections"], { queryParams: { cipherId: this.cipher.id } });
    }
  }

  cancel() {
    super.cancel();

    // Would be refactored after rework is done on the windows popout service
    if (this.inPopout && this.sessionId) {
      this.abortFido2Popout();
    }

    if (this.popupUtilsService.inTab(window)) {
      this.messagingService.send("closeTab");
      return;
    }

    if (this.inPopout && this.senderTabId) {
      this.close();
      return;
    }

    this.location.back();
  }

  // Used for closing single-action views
  close() {
    BrowserApi.focusTab(this.senderTabId);
    window.close();

    return;
  }

  // Used for aborting Fido2 popout
  abortFido2Popout() {
    BrowserFido2UserInterfaceSession.sendMessage({
      sessionId: this.sessionId,
      type: "AbortResponse",
      fallbackRequested: false,
    });

    return;
  }

  async generateUsername(): Promise<boolean> {
    const confirmed = await super.generateUsername();
    if (confirmed) {
      await this.saveCipherState();
      this.router.navigate(["generator"], { queryParams: { type: "username" } });
    }
    return confirmed;
  }

  async generatePassword(): Promise<boolean> {
    const confirmed = await super.generatePassword();
    if (confirmed) {
      await this.saveCipherState();
      this.router.navigate(["generator"], { queryParams: { type: "password" } });
    }
    return confirmed;
  }

  async delete(): Promise<boolean> {
    const confirmed = await super.delete();
    if (confirmed) {
      this.router.navigate(["/tabs/vault"]);
    }
    return confirmed;
  }

  toggleUriInput(uri: LoginUriView) {
    const u = uri as any;
    u.showCurrentUris = !u.showCurrentUris;
  }

  allowOwnershipOptions(): boolean {
    return (
      (!this.editMode || this.cloneMode) &&
      this.ownershipOptions &&
      (this.ownershipOptions.length > 1 || !this.allowPersonal)
    );
  }

  private saveCipherState() {
    return this.stateService.setAddEditCipherInfo({
      cipher: this.cipher,
      collectionIds:
        this.collections == null
          ? []
          : this.collections.filter((c) => (c as any).checked).map((c) => c.id),
    });
  }

  private setFocus() {
    window.setTimeout(() => {
      if (this.editMode) {
        return;
      }

      if (this.cipher.name != null && this.cipher.name !== "") {
        document.getElementById("loginUsername").focus();
      } else {
        document.getElementById("name").focus();
      }
    }, 200);
  }
}
