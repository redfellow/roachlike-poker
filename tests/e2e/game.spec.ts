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
		await actor.locator(".hand-card:not(:disabled)").first().click();
		await actor.locator(".seat--targetable .seat__target").click();
		await actor.locator(".claim-card").first().click();
		await actor.getByRole("button", { name: "Lähetä kortti" }).click();
		await expect(receiver.getByRole("button", { name: "Uskon", exact: true })).toBeVisible();
		await expect(receiver.locator(".playing-card")).not.toHaveClass(/known/);
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
			await leader.getByRole("button", { name: "Lähetä kortti" }).click();
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
