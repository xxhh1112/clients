import { ChangeDetectionStrategy, Component, Input, OnInit } from "@angular/core";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
} from "rxjs";

import { SettingsService } from "@bitwarden/common/abstractions/settings.service";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

/**
 * Provides a mapping from supported card brands to
 * the filenames of icon that should be present in images/cards folder of clients.
 */
const cardIcons: Record<string, string> = {
  Visa: "card-visa",
  Mastercard: "card-mastercard",
  Amex: "card-amex",
  Discover: "card-discover",
  "Diners Club": "card-diners-club",
  JCB: "card-jcb",
  Maestro: "card-maestro",
  UnionPay: "card-union-pay",
  RuPay: "card-ru-pay",
};

@Component({
  selector: "app-vault-icon",
  templateUrl: "icon.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements OnInit {
  @Input()
  set cipher(value: CipherView) {
    this.cipher$.next(value);
  }

  protected data$: Observable<{
    imageEnabled: boolean;
    image?: string;
    fallbackImage: string;
    icon?: string;
  }>;

  private cipher$ = new BehaviorSubject<CipherView>(undefined);

  constructor(
    private environmentService: EnvironmentService,
    private settingsService: SettingsService
  ) {}

  async ngOnInit() {
    const iconsUrl = this.environmentService.getIconsUrl();

    this.data$ = combineLatest([
      this.settingsService.disableFavicon$.pipe(distinctUntilChanged()),
      this.cipher$.pipe(filter((c) => c !== undefined)),
    ]).pipe(
      map(([disableFavicon, cipher]) => {
        const imageEnabled = !disableFavicon;
        let image = undefined;
        let fallbackImage = "";
        let icon = undefined;

        switch (cipher.type) {
          case CipherType.Login:
          case CipherType.Fido2Key: {
            icon = cipher.type === CipherType.Login ? "bwi-globe" : "bwi-passkey";

            let uri =
              cipher.type === CipherType.Login ? cipher.login.uri : cipher.fido2Key.launchUri;
            let isWebsite = false;

            if (uri) {
              if (uri.indexOf("androidapp://") === 0) {
                icon = "bwi-android";
                image = null;
              } else if (uri.indexOf("iosapp://") === 0) {
                icon = "bwi-apple";
                image = null;
              } else if (imageEnabled && uri.indexOf("://") === -1 && uri.indexOf(".") > -1) {
                uri = "http://" + uri;
                isWebsite = true;
              } else if (imageEnabled) {
                isWebsite = uri.indexOf("http") === 0 && uri.indexOf(".") > -1;
              }

              if (imageEnabled && isWebsite) {
                try {
                  image = iconsUrl + "/" + Utils.getHostname(uri) + "/icon.png";
                  fallbackImage =
                    cipher.type === CipherType.Login
                      ? "images/bwi-globe.png"
                      : "images/bwi-passkey";
                } catch (e) {
                  // Ignore error since the fallback icon will be shown if image is null.
                }
              }
            } else {
              image = null;
            }
            break;
          }
          case CipherType.SecureNote:
            icon = "bwi-sticky-note";
            break;
          case CipherType.Card:
            icon = "bwi-credit-card";
            if (imageEnabled && cipher.card.brand in cardIcons) {
              icon = "credit-card-icon " + cardIcons[cipher.card.brand];
            }
            break;
          case CipherType.Identity:
            icon = "bwi-id-card";
            break;
          default:
            break;
        }

        return {
          imageEnabled,
          image,
          fallbackImage,
          icon,
        };
      })
    );
  }
}
