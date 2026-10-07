import { expect, test } from "@playwright/test";

test("landing page credits the original Cockroach Poker game", async function ({ page }) {
	await page.goto("/");
	await expect(page.getByRole("link", { name: "Cockroach Poker" })).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Cockroach_Poker");
	await expect(page.getByText("Based on Cockroach Poker, designed by Jacques Zeimet.")).toBeVisible();
});

test("rules dialog takes focus, traps keyboard navigation and restores focus", async function ({ page }) {
	await page.goto("/");
	const opener = page.getByRole("button", { name: "Miten pelataan? ↗" });
	await opener.focus();
	await opener.click();
	const close = page.getByRole("button", { name: "Sulje" });
	await expect(close).toBeFocused();
	await page.keyboard.press("Shift+Tab");
	await expect(close).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(opener).toBeFocused();
});
