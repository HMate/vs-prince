import { expect } from "chai";
import { browser } from "@wdio/globals";

suite("Extension Test Suite", () => {
    test("Message test", async () => {
        const workbench = await browser.getWorkbench();
        await browser.executeWorkbench(async (vscode, param1) => {
            vscode.window.showInformationMessage(`Start all tests. ${param1} !`);
        }, "from wdio and vsprince !!! -__-");

        const notifs = await workbench.getNotifications();
        const message = await notifs[0].getMessage();
        console.log(message);
        expect(message).to.eq("Start all tests. from wdio and vsprince !!! -__- !");
    });

    test("Workspace test", async () => {
        await installPython();

        const workbench = await browser.getWorkbench();
        try {
            const existingNotifs = await workbench.getNotifications();
            console.log(`existingNotifs: ${existingNotifs.length}`);
            // Note: hiding notifications only works if the test window has focus. I'm not sure why, or how to fix this
            for (const notif of existingNotifs) {
                await notif.dismiss();
            }
        } catch (e) {
            // Ignore if no notifications to clear
        }

        // TODO: Delete, or do something about pyprince cache file
        await browser.executeWorkbench(async (vscode) => {
            const wsFolder = vscode.workspace.workspaceFolders[0];
            console.log("Opening file: " + wsFolder.uri.fsPath + "/main.py");
            await vscode.window.showTextDocument(vscode.Uri.joinPath(wsFolder.uri, "main.py"));
        });

        await browser.executeWorkbench(async (vscode) => {
            await vscode.commands.executeCommand("vs-prince.visualize-py-deps");
        });

        await browser.switchFrame($("iframe.webview"));
        await browser.switchFrame($('iframe[id="active-frame"]'));

        await browser.waitUntil(
            async () => {
                const svgRoot: ChainablePromiseElement = await browser.$("#prince-svg");
                const elems = await svgRoot.$$("rect").getElements();
                return elems.length > 5;
            },
            { timeout: 5000, interval: 500 }
        );

        await browser.saveScreen("screen-test");
        const svgRoot = await browser.$("#prince-svg");
        const elementMismatchPercentage = await browser.checkElement(svgRoot, "element-test");
        console.log(`Element mismatch percentage: ${elementMismatchPercentage} %`);
        expect(elementMismatchPercentage).to.be.lessThan(0.1);
    });

    async function installPython() {
        await browser.executeWorkbench(async (vscode) => {
            await vscode.commands.executeCommand("workbench.extensions.installExtension", "ms-python.python");
        });

        await browser.executeWorkbench(async (vscode) => {
            const pythonExtension = vscode.extensions.getExtension("ms-python.python");
            if (pythonExtension && !pythonExtension.isActive) {
                await pythonExtension.activate();
            }
        });
    }
});
