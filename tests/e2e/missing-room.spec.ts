import { expect, test } from "@playwright/test";

test("the missing-room back link returns to the front page", async function ({ page }) {
	await page.goto("/r/missing-room");
	await page.getByLabel("Millä nimellä sinua kirotaan?").fill("Eksynyt");
	await page.getByRole("button", { name: "Liity pöytään" }).click();
	await expect(page.getByRole("heading", { name: "Huonetta ei löytynyt. Tarkista kutsulinkki." })).toBeVisible();
	await page.evaluate(function () { (window as Window & { spaMarker?: string }).spaMarker = "preserved"; });
	await page.getByRole("link", { name: "Takaisin", exact: true }).click();
	await expect(page).toHaveURL("/");
	await expect(page.locator(".landing")).toBeVisible();
	await expect.poll(() => page.evaluate(function () { return (window as Window & { spaMarker?: string }).spaMarker; })).toBe("preserved");
});

test("the previous-room link is shown only while the stored room exists", async function ({ page, request }) {
	await page.addInitScript(function () {
		if (sessionStorage.getItem("resume-room-test-seeded")) { return; }
		sessionStorage.setItem("resume-room-test-seeded", "true");
		localStorage.setItem("torakka:room", "missing-room");
		localStorage.setItem("torakka:token:missing-room", "stale-token");
	});
	await page.goto("/");
	await expect(page.getByRole("link", { name: "Palaa aiempaan huoneeseen" })).toHaveCount(0);
	await expect.poll(() => page.evaluate(function () { return localStorage.getItem("torakka:room"); })).toBeNull();
	await expect.poll(() => page.evaluate(function () { return localStorage.getItem("torakka:token:missing-room"); })).toBeNull();

	const create = await request.post("/api/rooms");
	expect(create.ok()).toBe(true);
	const { id } = await create.json() as { id: string };
	await page.evaluate(function (roomId) { localStorage.setItem("torakka:room", roomId); }, id);
	await page.reload();
	await expect(page.getByRole("link", { name: "Palaa aiempaan huoneeseen" })).toHaveAttribute("href", `/r/${id}`);
});
