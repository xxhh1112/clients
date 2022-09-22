import { Component } from "@angular/core";

@Component({
  selector: "app-poc-auth",
  templateUrl: "poc-auth.component.html",
  styleUrls: [],
})
export class PocAuthComponent {
  // constructor() {}

  async authenticate() {
    // console.log("AUTH");
    await browser.runtime.sendMessage({ type: "auth-approve-popup" });
    window.close();
    // const tab = await browser.tabs.getCurrent();
    // await browser.tabs.sendMessage(tab.id, { type: "auth-approve" });
  }
}
