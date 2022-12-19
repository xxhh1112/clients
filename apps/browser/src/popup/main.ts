import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import BrowserPlatformUtilsService from "../services/browserPlatformUtils.service";

require("./scss/popup.scss");

import { AppModule } from "./app.module";

// We put this first to minimize the delay in window changing.
// Should be removed once we deprecate support for Safari 16.0 and older.
if (BrowserPlatformUtilsService.shouldApplySafariHeightFix(window)) {
  document.documentElement.classList.add("browser_safari_height");
}

if (process.env.ENV === "production") {
  enableProdMode();
}

function init() {
  platformBrowserDynamic().bootstrapModule(AppModule, { preserveWhitespaces: true });
}

init();
