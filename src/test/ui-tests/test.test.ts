import { expect } from "chai";
import { browser } from "@wdio/globals";

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

    test("Workspace test", async () => {
        await installPython();

        // TODO: Delete, or do something about pyprince cache file

        await browser.executeWorkbench(async (vscode) => {
            const wsFolder = vscode.workspace.workspaceFolders[0];
            console.log("Opening file: " + wsFolder.uri.fsPath + "/main.py");
            await vscode.window.showTextDocument(vscode.Uri.joinPath(wsFolder.uri, "main.py"));
        });

        await browser.executeWorkbench(async (vscode) => {
            await vscode.commands.executeCommand("vs-prince.visualize-py-deps");
        });

        console.log("Waiting 100 sec for visualize command to run...");
        await browser.pause(1_000_000);
        /*
        await browser.waitUntil(async () => {
            const panels = await browser.$$('div.webview');
            return panels.length > 0;
        }, { timeout: 5000 });
        */

        await browser.saveScreenshot("./test-screenshots/workspace-test.png");
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
