import path from "path";

import { test as base, chromium, type BrowserContext } from "@playwright/test";

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, "../build");
    const context = await chromium.launchPersistentContext("", {
      headless: false, // @TODO set to `true` when finished debugging
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
      ignoreDefaultArgs: ["--disable-component-extensions-with-background-pages"],
      viewport: {
        width: 1000,
        height: 1200,
      },
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // for manifest v2:
    let [background] = context.backgroundPages();
    if (!background) {
      background = await context.waitForEvent("backgroundpage");
    }

    /*
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background)
      background = await context.waitForEvent('serviceworker');
    */
    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
  // @TODO init test vault?
});
export const expect = test.expect;
