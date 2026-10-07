import { expect, test, type Page, type APIRequestContext } from "@playwright/test";

async function createSoloTable(page: Page, request: APIRequestContext, seatCount: number, reduced = true): Promise<void> {
	const create = await request.post("/api/rooms");
	expect(create.ok()).toBe(true);
	const { id } = await create.json() as { id: string };
	await page.goto(`/r/${id}`);
	await page.getByLabel("Millä nimellä sinua kirotaan?").fill(`Testaaja ${seatCount}`);
	await page.getByRole("button", { name: "Liity pöytään" }).click();
	for (let index = 1; index < seatCount; index++) { await page.getByRole("button", { name: "Lisää tietokonepelaaja" }).click(); }
	await expect(page.locator(".lobby-player")).toHaveCount(seatCount);
	if (reduced) { await page.getByLabel("Vähennä animaatioita").check(); }
	await page.getByRole("button", { name: "Olen valmis — ja epäilyttävä" }).click();
	await expect(page.getByText("Kaikki näyttävät syyllisiltä.")).toBeVisible({ timeout: 10000 });
}

async function playToEnd(page: Page): Promise<void> {
	for (let step = 0; step < 220; step++) {
		if (await page.getByText("Se oli siinä.", { exact: true }).isVisible()) { return; }
		const card = page.locator(".hand-card:not(:disabled)").first();
		const believe = page.locator(".responses").getByRole("button", { name: "Uskon", exact: true });
		if (await card.isVisible()) {
			try {
				await card.click({ timeout: 500 });
				await page.locator(".seat--targetable .seat__target").first().click({ timeout: 500 });
				const claim = page.locator(".claim-card--truth");
				await claim.click({ timeout: 500 });
				await claim.click({ timeout: 500 });
			}
			catch { await page.waitForTimeout(40); }
		}
		else if (await believe.isVisible()) { await believe.click({ timeout: 500 }).catch(function () { return; }); }
		else { await page.waitForTimeout(40); }
	}
	throw new Error("Solo browser game did not finish within 220 actions.");
}

async function closeSoloTable(page: Page): Promise<void> {
	page.on("dialog", function (dialog) { void dialog.accept(); });
	for (let attempt = 0; attempt < 20; attempt++) {
		const endPlaying = page.getByRole("button", { name: "Lopeta pelaaminen" });
		if (await endPlaying.isVisible()) { await endPlaying.click(); return; }
		const stop = page.getByRole("button", { name: "Keskeytä peli" });
		if (await stop.isVisible()) { await stop.click().catch(function () { return; }); await page.waitForTimeout(100); continue; }
		const close = page.getByRole("button", { name: "Poista aula" });
		if (await close.isVisible()) { await close.click(); return; }
		await page.waitForTimeout(100);
	}
	throw new Error("Could not close the solo test room.");
}

test.afterEach(async function ({ page }) {
	await closeSoloTable(page).catch(function () { return; });
});

for (const seatCount of [2, 3, 6]) {
	test(`solo game completes with ${seatCount} seats`, async function ({ page, request }) {
		test.setTimeout(180000);
		await createSoloTable(page, request, seatCount);
		await expect(page.locator(".seat")).toHaveCount(seatCount);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
		await playToEnd(page);
		await expect(page.getByText("ILLAN EPÄONNISTUJA")).toBeVisible();
		await expect(page.locator(".history tbody tr")).toHaveCount(seatCount);
		if (seatCount === 3) {
			await page.getByRole("button", { name: "Uusi peli — sama kutsulinkki" }).click();
			await expect(page.locator(".lobby-player--ready")).toHaveCount(2);
		}
		await closeSoloTable(page);
	});
}

test("six-seat table fits a portrait Chrome viewport", async function ({ browser, request }) {
	const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
	const page = await context.newPage();
	try {
		await createSoloTable(page, request, 6);
		await expect(page.locator(".seat")).toHaveCount(6);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
		await page.screenshot({ path: "test-results/six-seat-mobile.png", fullPage: true });
		await closeSoloTable(page);
	}
	finally { await context.close(); }
});

test("resolution exposes the accessible showdown without leaking the incoming card", async function ({ page, request }) {
	await createSoloTable(page, request, 2, false);
	for (let step = 0; step < 200; step++) {
		const card = page.locator(".hand-card:not(:disabled)").first();
		if (await card.isVisible()) {
			await card.click({ force: true });
			await page.locator(".seat--targetable .seat__target").click({ force: true });
			const claim = page.locator(".claim-card--truth");
			await claim.click({ force: true });
			await claim.click({ force: true });
			await expect(page.locator(".resolution")).toBeVisible({ timeout: 3000 });
			await expect(page.locator(".decision-token")).toBeVisible();
			await expect(page.locator(".showdown__card")).toHaveCount(2);
			return;
		}
		const believe = page.locator(".responses").getByRole("button", { name: "Uskon", exact: true });
		if (await believe.isVisible()) { await believe.click({ force: true }); }
		await page.waitForTimeout(40);
	}
	throw new Error("Human player did not receive an initiation turn.");
});

test("computer answer shows Totta or Valhetta feedback", async function ({ page, request }) {
	const create = await request.post("/api/rooms");
	expect(create.ok()).toBe(true);
	const { id } = await create.json() as { id: string };
	await page.goto(`/r/${id}`);
	await page.getByLabel("Millä nimellä sinua kirotaan?").fill("Testaaja");
	await page.getByRole("button", { name: "Liity pöytään" }).click();
	await page.getByRole("button", { name: "Lisää tietokonepelaaja" }).click();
	await page.getByLabel("Vähennä animaatioita").uncheck();
	await page.getByRole("button", { name: "Olen valmis — ja epäilyttävä" }).click();
	await expect(page.getByText("Kaikki näyttävät syyllisiltä.")).toBeVisible({ timeout: 10000 });
	for (let step = 0; step < 200; step++) {
		const card = page.locator(".hand-card:not(:disabled)").first();
		if (await card.isVisible()) {
			await card.click({ force: true });
			await page.locator(".seat--targetable .seat__target").first().click({ force: true });
			const claim = page.locator(".claim-card--truth");
			await claim.click({ force: true });
			await claim.click({ force: true });
			break;
		}
		await page.waitForTimeout(40);
	}
	await expect(page.locator(".resolution")).toBeVisible({ timeout: 10000 });
	await expect(page.locator(".decision-token")).toBeVisible();
	await expect(page.locator(".decision-token")).toContainText(/Uskon|En usko/);
	await expect(page.locator(".showdown__stamp")).toHaveText(/TOTTA|VALHE/);
});
