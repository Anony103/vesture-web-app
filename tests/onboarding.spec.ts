import { test, expect, type Page } from "@playwright/test";

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("login assets, password visibility and reset feedback", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Sign in to your Account" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("login.png"),
    fullPage: true,
  });
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page.getByLabel("Password", { exact: true }).fill("example-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("website preview");
  await page.getByRole("link", { name: "Forgot Your Password?" }).click();
  await page.getByLabel("Email Address").fill("demo@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(
    "No email has been sent",
  );
  expect(errors).toEqual([]);
});

test("registration validates input, supports editing and completes the preview", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/signup/account-type");
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await page.getByText("Public Sector Employee", { exact: true }).click();
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("account-type.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("First Name").fill("Ada");
  await page.getByLabel("Last Name").fill("Okafor");
  await page.getByLabel("Bank Verification Number").fill("12345678901");
  await page.getByLabel("Email Address").fill("ada@example.com");
  await page.getByLabel("Gender").selectOption("Female");
  await page.getByLabel("Date of Birth").fill("1994-04-20");
  await page.getByLabel("State of Origin").selectOption("Lagos");
  await page.getByLabel("Home Address").fill("12 Example Street");
  await page.getByLabel("Phone Number").fill("08012345678");
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("details.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath("verify.png"),
    fullPage: true,
  });
  await page.getByLabel("Digit 1", { exact: true }).fill("9999");
  await page.getByRole("button", { name: "Verify Account" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "incorrect",
  );
  await page.getByLabel("Digit 1", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Verify Account" }).click();
  await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
  await page.getByLabel("Upload identity document").setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("test"),
  });
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "JPG, PNG, or PDF",
  );
  await page.getByLabel("Upload identity document").setInputFiles({
    name: "staff-id.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await page.screenshot({
    path: testInfo.outputPath("step-" + page.url().split("/").pop() + ".png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Ada Okafor", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Edit Information" }).click();
  await expect(page.getByLabel("First Name")).toHaveValue("Ada");
  await page.getByLabel("First Name").fill("Adaeze");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Adaeze Okafor", { exact: true })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await page.getByLabel("Enter Password").fill("long-password");
  await page.getByLabel("Confirm Password").fill("wrong-password");
  await page.screenshot({
    path: testInfo.outputPath("step-" + page.url().split("/").pop() + ".png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "do not match",
  );
  await page.getByLabel("Confirm Password").fill("long-password");
  await page.screenshot({
    path: testInfo.outputPath("step-" + page.url().split("/").pop() + ".png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re all set to get started" }),
  ).toBeVisible();
  await expect(page.getByText(/no account has been created/)).toBeVisible();
  await noOverflow(page);
  expect(errors).toEqual([]);
});

test("direct links cannot skip registration prerequisites", async ({
  page,
}) => {
  await page.goto("/signup/password");
  await expect(page).toHaveURL(/\/signup\/account-type$/);
  await expect(
    page.getByRole("heading", { name: "Choose Account Type" }),
  ).toBeVisible();
});
