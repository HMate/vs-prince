import { expect } from "chai";
import { browser } from "@wdio/globals";

// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
    test("Message test", async () => {
        const workbench = await browser.getWorkbench();
        await browser.executeWorkbench((vscode, param1) => {
            vscode.window.showInformationMessage(`Start all tests. ${param1} !`);
        }, "from wdio and vsprince !!! -__-");

        const notifs = await workbench.getNotifications();
        const message = await notifs[0].getMessage();
        console.log(message);
        expect(message).to.eq("Start all tests. from wdio and vsprince !!! -__- !");
    });

    test("Sample test", () => {
        expect([1, 2, 3].indexOf(5)).to.eq(-1);
        expect([1, 2, 3].indexOf(0)).to.eq(-1);
    });
});
