import { browser, expect } from "@wdio/globals";

suite("VS Code Extension Testing", () => {
    test("should be able to load VSCode", async () => {
        const workbench = await browser.getWorkbench();
        expect(await workbench.getTitleBar().getTitle()).toContain("[Extension Development Host]");
    });
});
