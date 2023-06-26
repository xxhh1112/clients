import { Page } from "@playwright/test";

import { test, expect } from "./fixtures";

let page: Page;

test.describe("Extension autofills forms when triggered", () => {
  test("Autofill basic form", async ({ context, extensionId }) => {
    // Log in to the extension vault
    page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/index.html?uilocation=popout`);
    await page.getByLabel("Email address").click();
    await page.getByLabel("Email address").fill(process?.env?.VAULT_EMAIL || "");
    await page.getByRole("button", { name: "Continue" }).click();

    // @TODO temporary workaround for the live URL-encoding not matching output of `encodeURI` or `encodeURIComponent`
    const urlEncodedLoginEmail = encodeURI(process?.env?.VAULT_EMAIL || "").replace("+", "%2B");
    await page.waitForURL(
      `chrome-extension://${extensionId}/popup/index.html?uilocation=popout#/login?email=${urlEncodedLoginEmail}`
    );
    await page.getByLabel("Master password").fill(process?.env?.VAULT_PASSWORD || "");
    await page.getByRole("button", { name: "Log in with master password" }).click();
    await page.waitForURL(
      `chrome-extension://${extensionId}/popup/index.html?uilocation=popout#/tabs/vault`
    );
    await page.waitForTimeout(2000);

    // Open the test page
    const testPage = await context.newPage();
    await testPage.goto("tests/test-pages/basic-form.html");
    await testPage.waitForURL("tests/test-pages/basic-form.html");
    await testPage.waitForTimeout(1000);

    const [backgroundPage] = context.backgroundPages();

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

    expect(testPage.locator("#username")).toHaveValue("jsmith");
    expect(testPage.locator("#password")).toHaveValue("areallygoodpassword");

    // Hold the window open (don't close out)
    // await testPage.waitForTimeout(20000000); // @TODO set to true when finished debugging

    context.close();
  });
});
