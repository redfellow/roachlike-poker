import { expect, test } from "@playwright/test";

test("host can publish a lobby on the landing page", async function ({ browser, request }) {
	const create = await request.post("/api/rooms");
	expect(create.ok()).toBe(true);
	const { id } = await create.json() as { id: string };
	const hostContext = await browser.newContext();
	const visitorContext = await browser.newContext();
	try {
		const host = await hostContext.newPage();
		await host.goto(`/r/${id}`);
		await host.getByLabel("Millä nimellä sinua kirotaan?").fill("Avo-Reiska");
		await host.getByRole("button", { name: "Liity pöytään" }).click();
		await host.getByRole("button", { name: /Herrasmiespokeri/ }).click();
		await expect(host.locator(".app")).toHaveClass(/theme--herrasmiespokeri/);
		await expect(host.getByRole("button", { name: /Herrasmiespokeri/ })).toHaveAttribute("aria-pressed", "true");
		await host.getByLabel("Näytä aula avoimena etusivulla").click();
		await expect(host.getByLabel("Näytä aula avoimena etusivulla")).toBeChecked();
		await expect(host.getByText("AVOIN PÖYTÄ")).toBeVisible();

		const visitor = await visitorContext.newPage();
		await visitor.goto("/");
		const room = visitor.locator(`a[href="/r/${id}"]`);
		await expect(room).toContainText("Avo-Reiska");
		await expect(room).toContainText("Herrasmiespokeri");
		await expect(room).toContainText("1/6 pelaajaa");
		await room.click();
		await expect(visitor.locator(".landing")).toHaveClass(/theme--herrasmiespokeri/);
		await expect(visitor.getByText("Herrasmies vai täyttä paskaa?", { exact: false })).toBeVisible();
	}
	finally {
		await hostContext.close();
		await visitorContext.close();
	}
});
