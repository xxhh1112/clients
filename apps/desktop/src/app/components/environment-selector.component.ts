import { animate, state, style, transition, trigger } from "@angular/animations";
import { ConnectedPosition } from "@angular/cdk/overlay";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { concatMap, Subject, takeUntil } from "rxjs";

import { MessagingService } from "@bitwarden/common/abstractions/messaging.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { TokenService } from "@bitwarden/common/auth/abstractions/token.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { Utils } from "@bitwarden/common/misc/utils";
import { Account } from "@bitwarden/common/models/domain/account";
import { ConfigServiceAbstraction } from "@bitwarden/common/abstractions/config/config.service.abstraction";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";

@Component({
    selector: "environment-selector",
    templateUrl: "environment-selector.component.html",
    animations: [
      trigger("transformPanel", [
        state(
          "void",
          style({
            opacity: 0,
          })
        ),
        transition(
          "void => open",
          animate(
            "100ms linear",
            style({
              opacity: 1,
            })
          )
        ),
        transition("* => void", animate("100ms linear", style({ opacity: 0 }))),
      ]),
    ],
  })
  export class EnvironmentSelectorComponent implements OnInit, OnDestroy {
  isOpen = false;  
  isEuServer = true;
  euServerFlagEnabled: boolean;
  overlayPostition: ConnectedPosition[] = [
    {
      originX: "end",
      originY: "bottom",
      overlayX: "end",
      overlayY: "top",
    },
  ];

  constructor(
    private stateService: StateService,
    private configService: ConfigServiceAbstraction,
  ) {}

  async ngOnInit() {
    this.euServerFlagEnabled = await this.configService.getFeatureFlagBool(
      FeatureFlag.DisplayEuEnvironmentFlag
    );
    this.isEuServer = Utils.getDomain(window.location.href).includes(".eu");
  }

  ngOnDestroy(): void {
    throw new Error("Method not implemented.");
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  close() {
    this.isOpen = false;
  }
  }