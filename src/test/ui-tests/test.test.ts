import { expect } from "chai";
import { browser } from "@wdio/globals";

// import * as myExtension from '../../extension';
// import * as vscode from "vscode";

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
        await browser.executeWorkbench(async (vscode) => {
            await vscode.commands.executeCommand("workbench.extensions.installExtension", "ms-python.python");
        });

        await browser.executeWorkbench(async (vscode) => {
            const pythonExtension = vscode.extensions.getExtension("ms-python.python");
            if (pythonExtension && !pythonExtension.isActive) {
                await pythonExtension.activate();
            }
        });

        // TODO: Delete, or do something about pyprince cache file

        await browser.executeWorkbench((vscode) => {
            const wsFolder = vscode.workspace.workspaceFolders[0];
            console.log("Opening file: " + wsFolder.uri.fsPath + "/main.py");
            vscode.window.showTextDocument(vscode.Uri.joinPath(wsFolder.uri, "main.py"));
        });

        await browser.executeWorkbench((vscode) => {
            vscode.commands.executeCommand("vs-prince.visualize-py-deps");
        });

        await browser.pause(5000);
        /*
        await browser.waitUntil(async () => {
            const panels = await browser.$$('div.webview');
            return panels.length > 0;
        }, { timeout: 5000 });
        */

        await browser.saveScreenshot("./test-screenshots/workspace-test.png");
    });
});
