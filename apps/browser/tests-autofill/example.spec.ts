import { resolve } from "path";

import { test, expect } from "@playwright/test";

import AutofillService from "@bitwarden/browser/services/autofill.service";

test.beforeEach(async ({ context }) => {
  await context.addInitScript({
    path: './tests-autofill/build/autofill.js',
  });
});

const autofillService = new AutofillService(null, null, null, null, null);

test("homepage has Playwright in title and get started link linking to the intro page", async ({
  page,
}) => {
  await page.goto("https://vault.bitwarden.com/");

  const l = await page.evaluate(() => (window as any).collect());

  const data = await autofillService.getFormsWithPasswordFields({
    command: "collectPageDetailsResponse",
    details: l,
  });

  console.log(data);

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
