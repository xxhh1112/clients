import { test, expect } from "@playwright/test";

import AutofillService from "@bitwarden/browser/services/autofill.service";
import { CipherType } from "@bitwarden/common/enums/cipherType";
import { CipherView } from "@bitwarden/common/models/view/cipher.view";
import { LoginView } from "@bitwarden/common/models/view/login.view";

test.beforeEach(async ({ context }) => {
  await context.addInitScript({
    path: "./tests-autofill/build/autofill.js",
  });
});

const stateService: any = {
  getCanAccessPremium: () => Promise.resolve(false),
};

const eventService: any = {
  collect: () => Promise.resolve(),
}

const autofillService = new AutofillService(null, stateService, null, eventService, null);

test("homepage has Playwright in title and get started link linking to the intro page", async ({
  page,
}) => {
  await page.goto("https://vault.bitwarden.com/");
  await page.waitForSelector("#login_input_email");

  const pageDetails = JSON.parse(await page.evaluate(() => (window as any).collect()));
console.log(pageDetails);

  const cipher = new CipherView();
  cipher.type = CipherType.Login;
  cipher.login = new LoginView();
  cipher.login.username = "test";
  cipher.login.password = "123";

  const tab = {
    index: 1,
    pinned: false,
    highlighted: false,
    windowId: 1,
    active: true,
    incognito: false,
    selected: true,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
  };

  const totp = await autofillService.doAutoFill({
    tab: tab,
    cipher: cipher,
    pageDetails: [
      {
        frameId: 1,
        tab: tab,
        details: pageDetails,
      },
    ],
    fillNewPassword: true,
    skipLastUsed: true,
  });

  console.log(totp);
  /*
  const data = await autofillService.getFormsWithPasswordFields({
    command: "collectPageDetailsResponse",
    details: l,
  });

  console.log(data);
*/
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);

  // create a locator
  const getStarted = page.locator("text=Get Started");

  // Expect an attribute "to be strictly equal" to the value.
  await expect(getStarted).toHaveAttribute("href", "/docs/intro");

  // Click the get started link.
  await getStarted.click();

  // Expects the URL to contain intro.
  await expect(page).toHaveURL(/.*intro/);
});
