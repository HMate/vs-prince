import { expect } from "chai";
import { browser } from "@wdio/globals";
import { Workbench } from "wdio-vscode-service";

suite("Extension Test Suite", () => {
    let testContext: Mocha.Context;

    suiteSetup(function () {
        testContext = this;
    });

    test("Message test", async function () {
        const workbench = await browser.getWorkbench();
        await browser.executeWorkbench(async (vscode, param1) => {
            vscode.window.showInformationMessage(`Start all tests. ${param1} !`);
        }, "from wdio and vsprince !!! -__-");

        const notifs = await workbench.getNotifications();
        const message = await notifs[0].getMessage();
        logTestMessage(message);
        expect(message).to.eq("Start all tests. from wdio and vsprince !!! -__- !");
    });

    test("Workspace test", async function () {
        await installPython();

        const workbench: Workbench = await browser.getWorkbench();

        await clearNotificationsRobustly(workbench);

        // TODO: Delete, or do something about pyprince cache file
        await browser.executeWorkbench(async (vscode) => {
            const wsFolder = vscode.workspace.workspaceFolders[0];
            console.log("Opening file: " + wsFolder.uri.fsPath + "/main.py");
            await vscode.window.showTextDocument(vscode.Uri.joinPath(wsFolder.uri, "main.py"));
        });

        await browser.executeWorkbench(async (vscode) => {
            await vscode.commands.executeCommand("vs-prince.visualize-py-deps");
        });

        await switchToWebviewIFrame(browser);

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
        logTestMessage(`Element mismatch percentage: ${elementMismatchPercentage} %`);

        // 3.5 is due to order of imports can change, and reltest package positions can vary
        const differenceThreshold = 3.5;
        expect(elementMismatchPercentage).to.be.lessThan(differenceThreshold);
    });

    async function switchToWebviewIFrame(browser: WebdriverIO.Browser) {
        await browser.switchFrame($("iframe.webview"));
        await browser.switchFrame($('iframe[id="active-frame"]'));
    }

    async function installPython() {
        logTestMessage(`Install Python extension for VSCode`);
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

    async function waitUntilNotificationsDisappear(workbench: Workbench) {
        try {
            const standaloneNotifs = await workbench.getNotifications();
            logTestMessage(`existingNotifs: ${standaloneNotifs.length}`);

            for (const notif of standaloneNotifs) {
                try {
                    const message = await notif.getMessage();
                    logTestMessage(`Dismissing notification: '${message}'`);
                    await notif.dismiss();
                } catch (e) {
                    logTestWarning(`Failed to dismiss standalone notification: ${e}`);
                    await tryManualDismissal();
                }
            }
        } catch (e) {
            logTestMessage("No existing notifications to dismiss or failed to access them:", e);
        }
    }

    /**
     * Current version of wdio is outdated, it does not handle notifiations correctly, so try close them manually.
     */
    async function tryManualDismissal() {
        const possibleSelectors = [
            ".codicon-notifications-clear",
            ".codicon-close",
            ".clear-notification-action",
            ".notification .codicon-close",
            ".notification-toast .codicon-close",
        ];

        for (const selector of possibleSelectors) {
            try {
                const button = await browser.$(selector);
                if (await button.isDisplayed()) {
                    await button.click();
                    logTestMessage(`Successfully dismissed with selector: ${selector}`);
                    return;
                }
            } catch (e) {
                // Try next selector
            }
        }
        logTestWarning("Could not dismiss notification with any known selector");
    }

    async function clearNotificationsRobustly(workbench: Workbench, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logTestMessage(`Attempt ${attempt} to clear notifications`);

                await waitUntilNotificationsDisappear(workbench);

                const remainingNotifs = await workbench.getNotifications();
                if (remainingNotifs.length === 0) {
                    logTestMessage("All notifications successfully cleared");
                    return;
                } else {
                    logTestMessage(`${remainingNotifs.length} notifications still present after attempt ${attempt}`);
                }
            } catch (e) {
                logTestWarning(`Attempt ${attempt} failed:`, e);
            }

            await browser.pause(1000);
        }

        logTestWarning("Could not clear all notifications after all retries, continuing with test");
    }

    function logTestMessage(...message: any[]) {
        console.log(`[${new Date().toISOString()}][${testContext.test?.title}] `, ...message);
    }

    function logTestWarning(...message: any[]) {
        console.warn(`[${new Date().toISOString()}][${testContext.test?.title}] `, ...message);
    }
});
