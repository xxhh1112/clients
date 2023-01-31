import Swal, { SweetAlertIcon } from "sweetalert2";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";

import BrowserPlatformUtilsService from "../../services/browserPlatformUtils.service";

export class PopupBrowserPlatformUtilsService extends BrowserPlatformUtilsService {
  constructor(
    private i18nService: I18nService,
    messagingService: MessagingService,
    clipboardWriteCallback: (clipboardValue: string, clearMs: number) => void,
    biometricCallback: () => Promise<boolean>,
    window: Window & typeof globalThis
  ) {
    super(messagingService, clipboardWriteCallback, biometricCallback, window);
  }

  override async showDialog(
    body: string,
    title?: string,
    confirmText?: string,
    cancelText?: string,
    type?: string,
    bodyIsHtml?: boolean
  ): Promise<boolean> {
    let iconClasses: string = null;
    if (type != null) {
      // If you add custom types to this part, the type to SweetAlertIcon cast below needs to be changed.
      switch (type) {
        case "success":
          iconClasses = "bwi-check text-success";
          break;
        case "warning":
          iconClasses = "bwi-exclamation-triangle text-warning";
          break;
        case "error":
          iconClasses = "bwi-error text-danger";
          break;
        case "info":
          iconClasses = "bwi-info-circle text-info";
          break;
        default:
          break;
      }
    }

    const confirmed = await Swal.fire<boolean>({
      heightAuto: false,
      buttonsStyling: false,
      icon: type as SweetAlertIcon, // required to be any of the SweetAlertIcons to output the iconHtml.
      iconHtml:
        iconClasses != null ? `<i class="swal-custom-icon bwi ${iconClasses}"></i>` : undefined,
      text: body,
      html: body,
      titleText: title,
      showCancelButton: cancelText != null,
      cancelButtonText: cancelText,
      showConfirmButton: true,
      confirmButtonText: confirmText == null ? this.i18nService.t("ok") : confirmText,
      timer: 300000,
    });

    return confirmed.value;
  }
}
