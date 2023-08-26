import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

@Component({
  selector: "phishing-callout",
  templateUrl: "phishing-callout.component.html",
  standalone: true,
  imports: [CommonModule, JslibModule],
})
export class PhishingCalloutComponent implements OnInit {
  @Input() isHidden = true;

  constructor(private stateService: StateService) {}

  async ngOnInit() {
    this.isHidden = await this.stateService.getDismissedPhishingCallout();
  }

  protected async dismiss() {
    await this.stateService.setDismissedPhishingCallout(true);
    this.isHidden = true;
  }
}
