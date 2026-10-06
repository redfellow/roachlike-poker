import { expect, test } from "@playwright/test";

test("landing page credits the original Cockroach Poker game", async function ({ page }) {
	await page.goto("/");
	await expect(page.getByRole("link", { name: "Cockroach Poker" })).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Cockroach_Poker");
	await expect(page.getByText("Based on Cockroach Poker, designed by Jacques Zeimet.")).toBeVisible();
});
