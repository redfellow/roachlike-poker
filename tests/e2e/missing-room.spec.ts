import { expect, test } from "@playwright/test";

test("the missing-room back link returns to the front page", async function ({ page }) {
	await page.goto("/r/missing-room");
	await page.getByLabel("Millä nimellä sinua kirotaan?").fill("Eksynyt");
	await page.getByRole("button", { name: "Liity pöytään" }).click();
	await expect(page.getByRole("heading", { name: "Huonetta ei löytynyt. Tarkista kutsulinkki." })).toBeVisible();
	await page.getByRole("link", { name: "Takaisin", exact: true }).click();
	await expect(page).toHaveURL("/");
	await expect(page.locator(".landing")).toBeVisible();
});
