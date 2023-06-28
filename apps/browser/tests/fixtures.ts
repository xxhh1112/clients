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
      headless: false, // should always be `false`, even when testing headless Chrome
      args: [
        ...(["1", "console"].includes(process.env.PWDEBUG) ? [] : [`--headless=new`]), // use for headless testing on Chrome
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
    // await context.close();
  },
  extensionId: async ({ context }, use) => {
    let background;

    if (process.env.MANIFEST_VERSION === "3") {
      background = context.serviceWorkers()[0];

      if (!background) background = await context.waitForEvent("serviceworker");
    } else {
      // for manifest v2:
      background = context.backgroundPages()[0];

      if (!background) background = await context.waitForEvent("backgroundpage");
    }

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});

export const expect = test.expect;
