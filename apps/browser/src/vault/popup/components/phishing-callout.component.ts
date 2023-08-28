import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

@Component({
  selector: "phishing-callout",
  templateUrl: "phishing-callout.component.html",
  standalone: true,
  imports: [CommonModule, JslibModule],
})
export class PhishingCalloutComponent implements OnInit {
  @Input() isHidden = true;
  @Input() currentTabURL: string;

  constructor(private stateService: StateService, private environmentService: EnvironmentService) {}

  async ngOnInit() {
    const isTrustedHost = this.environmentService.isTrustedHost(this.currentTabURL);
    this.isHidden = (await this.stateService.getDismissedPhishingCallout()) || !isTrustedHost;
  }

  protected async dismiss() {
    await this.stateService.setDismissedPhishingCallout(true);
    this.isHidden = true;
  }
}
