import { test, expect } from "@playwright/test";

test("private room, full game, recap, rematch, hidden hands and reload", async function ({ browser, request }) {
	test.setTimeout(180000);
	const create = await request.post("/api/rooms");
	expect(create.ok()).toBe(true);
	const { id } = await create.json() as { id: string };
	const contexts = await Promise.all([browser.newContext(), browser.newContext({ viewport: { width: 390, height: 844 } }), browser.newContext()]);
	const pages = await Promise.all(contexts.map(c => c.newPage()));
	try {
		for (let i = 0; i < 2; i++) {
			await pages[i]!.goto(`/r/${id}`);
			await pages[i]!.getByLabel("Millä nimellä sinua kirotaan?").fill(`Pelaaja ${i + 1}`);
			await pages[i]!.getByRole("button", { name: "Liity pöytään" }).click();
			await expect(pages[i]!.getByText("Pöytä on katettu.")).toBeVisible();
			await pages[i]!.getByLabel("Vähennä animaatioita").check();
		}
		for (let i = 0; i < 2; i++) { await pages[i]!.getByRole("button", { name: "Olen valmis" }).click(); }
		await expect(pages[0]!.getByText("Kaikki näyttävät syyllisiltä.")).toBeVisible({ timeout: 10000 });
		await expect(pages[1]!.getByText("Kaikki näyttävät syyllisiltä.")).toBeVisible();
		await pages[2]!.goto(`/r/${id}`);
		await pages[2]!.getByLabel("Millä nimellä sinua kirotaan?").fill("Katsoja");
		await pages[2]!.getByRole("button", { name: "Liity pöytään" }).click();
		await expect(pages[2]!.getByText("KATSOMOSSA · VAIN JULKINEN TIETO")).toBeVisible();
		await expect(pages[2]!.locator(".hand-card")).toHaveCount(0);
		const actor = await pages[0]!.locator(".hand-card:not(:disabled)").count() ? pages[0]! : pages[1]!;
		const receiver = actor === pages[0] ? pages[1]! : pages[0]!;
		if (actor === pages[0]) {
			const ownSeat = await actor.locator(".seats--around .seat:last-child").boundingBox();
			const firstCard = await actor.locator(".hand-card").first().boundingBox();
			expect(ownSeat).not.toBeNull();
			expect(firstCard).not.toBeNull();
			expect(firstCard!.y).toBeGreaterThanOrEqual(ownSeat!.y + ownSeat!.height + 4);
		}
		await actor.locator(".hand-card:not(:disabled)").first().click();
		await actor.locator(".seat--targetable .seat__target").click();
		await actor.locator(".claim-card").first().click();
		await actor.locator(".claim-card").first().click();
		await expect(actor.locator(".table-routes__segment")).toHaveCount(1);
		await expect(receiver.getByRole("button", { name: "Uskon", exact: true })).toBeVisible();
		await expect(receiver.locator(".playing-card")).not.toHaveClass(/known/);
		if (receiver === pages[0]) {
			const ownSeat = await receiver.locator(".seats--around .seat:last-child").boundingBox();
			const responses = await receiver.locator(".responses").boundingBox();
			expect(ownSeat).not.toBeNull();
			expect(responses).not.toBeNull();
			expect(responses!.y).toBeGreaterThanOrEqual(ownSeat!.y + ownSeat!.height + 4);
		}
		await receiver.getByRole("button", { name: "Uskon", exact: true }).click();
		await expect(receiver.locator(".resolution")).toBeHidden({ timeout: 7000 });
		for (const page of pages.slice(0, 2)) {
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
		}
		await pages[1]!.screenshot({ path: "test-results/table-mobile.png", fullPage: true });
		await pages[0]!.screenshot({ path: "test-results/table-desktop.png", fullPage: true });
		await pages[1]!.reload();
		await expect(pages[1]!.getByText("Kaikki näyttävät syyllisiltä.")).toBeVisible();
		await expect(pages[1]!.locator(".hand-card").first()).toBeVisible();
		for (let turn = 0; turn < 60; turn++) {
			if (await pages[0]!.getByText("Se oli siinä.", { exact: true }).isVisible()) { break; }
			const leader = await pages[0]!.locator(".hand-card:not(:disabled)").count() ? pages[0]! : pages[1]!;
			const target = leader === pages[0] ? pages[1]! : pages[0]!;
			await expect(leader.locator(".resolution")).toBeHidden({ timeout: 7000 });
			const first = leader.locator(".hand-card:not(:disabled)").first();
			await first.click();
			await leader.locator(".seat--targetable .seat__target").click();
			await leader.locator(".claim-card--truth").click();
			await leader.locator(".claim-card--truth").click();
			await target.getByRole("button", { name: "Uskon", exact: true }).click();
			await expect(target.locator(".playing-card")).toHaveCount(0);
		}
		await expect(pages[0]!.getByText("Se oli siinä.", { exact: true })).toBeVisible();
		await expect(pages[0]!.getByText("ILLAN EPÄONNISTUJA")).toBeVisible();
		await expect(pages[0]!.locator(".history tbody tr")).toHaveCount(2);
		await pages[0]!.getByRole("button", { name: "Uusi peli — sama kutsulinkki" }).click();
		await expect(pages[1]!.getByText("Pöytä on katettu.")).toBeVisible();
		await pages[0]!.getByRole("button", { name: /Historia/ }).click();
		await expect(pages[0]!.locator(".modal .history tbody tr")).toHaveCount(2);
		await expect(pages[0]!.locator(".modal .history")).toContainText("hävisi.");

	}
	finally { for (const context of contexts) { void context.close(); } }
});

test("keeps desktop response controls clear of the local player seat", async function ({ browser, request }) {
	const create = await request.post("/api/rooms");
	expect(create.ok()).toBe(true);
	const { id } = await create.json() as { id: string };
	const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
	const pages = await Promise.all(contexts.map(context => context.newPage()));
	try {
		for (let index = 0; index < pages.length; index++) {
			await pages[index]!.goto(`/r/${id}`);
			await pages[index]!.getByLabel("Millä nimellä sinua kirotaan?").fill(`Asettelu ${index + 1}`);
			await pages[index]!.getByRole("button", { name: "Liity pöytään" }).click();
			await pages[index]!.getByLabel("Vähennä animaatioita").check();
		}
		for (const page of pages) { await page.getByRole("button", { name: "Olen valmis" }).click(); }
		await expect(pages[0]!.getByText("Kaikki näyttävät syyllisiltä.")).toBeVisible({ timeout: 10000 });
		const actor = await pages[0]!.locator(".hand-card:not(:disabled)").count() ? pages[0]! : pages[1]!;
		const receiver = actor === pages[0] ? pages[1]! : pages[0]!;
		const initialOwnSeat = await actor.locator(".seats--around .seat:last-child").boundingBox();
		const initialFirstCard = await actor.locator(".hand-card").first().boundingBox();
		expect(initialOwnSeat).not.toBeNull();
		expect(initialFirstCard).not.toBeNull();
		expect(initialFirstCard!.y).toBeGreaterThanOrEqual(initialOwnSeat!.y + initialOwnSeat!.height + 4);
		await actor.locator(".hand-card:not(:disabled)").first().click();
		await actor.locator(".seat--targetable .seat__target").click();
		await actor.locator(".claim-card").first().dblclick();
		await expect(receiver.locator(".responses")).toBeVisible();
		await expect(receiver.locator(".table-routes__path")).toHaveAttribute("d", / Q /);
		const ownSeat = await receiver.locator(".seats--around .seat:last-child").boundingBox();
		const responses = await receiver.locator(".responses").boundingBox();
		const topSeat = await receiver.locator(".seats--2 .seat:first-child").boundingBox();
		const tableLabel = await receiver.locator(".play-area > .eyebrow").boundingBox();
		expect(ownSeat).not.toBeNull();
		expect(responses).not.toBeNull();
		expect(topSeat).not.toBeNull();
		expect(tableLabel).not.toBeNull();
		expect(responses!.y).toBeGreaterThanOrEqual(ownSeat!.y + ownSeat!.height + 4);
		expect(tableLabel!.y).toBeGreaterThanOrEqual(topSeat!.y + topSeat!.height + 4);
	}
	finally { for (const context of contexts) { await context.close(); } }
});
