import { Page } from "@playwright/test";

import { testPages } from "./constants";
import { test, expect } from "./fixtures";

let testPage: Page;

test.describe("Extension autofills forms when triggered", () => {
  test("Log in to the vault, open pages, and autofill forms", async ({ context, extensionId }) => {
    const [backgroundPage] = context.backgroundPages();
    const contextPages = context.pages();

    await test.step("Close the extension welcome page when it pops up", async () => {
      const welcomePage = contextPages[1];
      if (welcomePage) {
        welcomePage.close();
      }

      testPage = contextPages[0];
    });

    await test.step("Log in to the extension vault", async () => {
      await testPage.goto(`chrome-extension://${extensionId}/popup/index.html?uilocation=popout`);
      await testPage.getByLabel("Email address").click();
      await testPage.getByLabel("Email address").fill(process?.env?.VAULT_EMAIL || "");
      await testPage.getByRole("button", { name: "Continue" }).click();

      // @TODO temporary workaround for the live URL-encoding not matching output of `encodeURI` or `encodeURIComponent`
      const urlEncodedLoginEmail = encodeURI(process?.env?.VAULT_EMAIL || "").replace("+", "%2B");
      await testPage.waitForURL(
        `chrome-extension://${extensionId}/popup/index.html?uilocation=popout#/login?email=${urlEncodedLoginEmail}`,
        { waitUntil: "load" }
      );
      await testPage.getByLabel("Master password").fill(process?.env?.VAULT_PASSWORD || "");
      await testPage.getByRole("button", { name: "Log in with master password" }).click();
      await testPage.waitForURL(
        `chrome-extension://${extensionId}/popup/index.html?uilocation=popout#/tabs/vault`,
        { waitUntil: "load" }
      );
      const vaultIsLoaded = testPage.locator("main app-vault-select");
      await vaultIsLoaded.waitFor();
    });

    for (const page of testPages) {
      const { url, inputs } = page;

      await test.step(`Autofill the form on page ${url}`, async () => {
        await testPage.goto(url);
        await testPage.waitForURL(url, { waitUntil: "load" });

        backgroundPage.evaluate(() =>
          chrome.tabs.query(
            { active: true },
            (tabs) =>
              tabs[0] &&
              chrome.tabs.sendMessage(tabs[0]?.id || 0, {
                command: "collectPageDetails",
                tab: tabs[0],
                sender: "autofill_cmd",
              })
          )
        );

        for (const inputKey of Object.keys(inputs)) {
          await expect
            .soft(testPage.locator(inputs[inputKey].selector))
            .toHaveValue(inputs[inputKey].value);
        }
      });
    }

    // Hold the window open (don't close out)
    // await testPage.pause(); // @TODO remove when finished debugging
  });
});
