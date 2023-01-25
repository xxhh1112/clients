import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

require("./scss/popup.scss");

import { Mv3AppModule } from "./mv3-app.module";

if (process.env.ENV === "production") {
  enableProdMode();
}

function init() {
  platformBrowserDynamic().bootstrapModule(Mv3AppModule, { preserveWhitespaces: true });
}

init();
