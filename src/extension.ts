import * as vscode from "vscode";
import * as fs from "fs";
import { PrinceClient } from "./PrinceClient";

/** TODO - For release 0.1:
 * - Reload tab contents after window is restarted
 * - Remove Ctrl+D as default keybinding - add right click menu instead
 * - Create package npm for pyprince
 * - Create vscode package for vsc-prince
 * - Fix pyprince to not run top level statements
 */

export function activate(context: vscode.ExtensionContext): void {
    let cachedPanel: vscode.WebviewPanel | null = null;

    const logChannel = vscode.window.createOutputChannel("VSPrince");
    logTerminal(logChannel, "Command vs-prince activated");

    const disposable = vscode.commands.registerCommand("vs-prince.visualize-py-deps", () => {
        try {
            const mediaUri = vscode.Uri.joinPath(context.extensionUri, "media");
            if (cachedPanel == null) {
                const workspaceUris = vscode.workspace.workspaceFolders?.map((dir) => dir.uri) ?? [];
                cachedPanel = vscode.window.createWebviewPanel("princeViz", "Prince", vscode.ViewColumn.Active, {
                    enableScripts: true,
                    localResourceRoots: [mediaUri].concat(workspaceUris),
                });

                updateViewHtml(cachedPanel, mediaUri);

                cachedPanel.onDidDispose(() => {
                    // Fired when user closes the webview tab.
                    cachedPanel = null;
                });
                drawPythonDependencies(logChannel, cachedPanel);
            } else {
                cachedPanel.reveal(vscode.window.activeTextEditor?.viewColumn);
                drawPythonDependencies(logChannel, cachedPanel);
            }
        } catch (error) {
            logTerminal(logChannel, `Prince py deps run into error: ${error}`);
            vscode.window.showErrorMessage(`Prince py deps run into error: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
    console.log("Command vs-prince deactivated");
}

function drawPythonDependencies(logChannel: vscode.OutputChannel, panel: vscode.WebviewPanel): void {
    panel.webview.postMessage({ command: "show-loading" });
    const editor = vscode.window.activeTextEditor;
    if (editor == null) {
        vscode.window.showInformationMessage("No file selected to show dependencies for");
        return;
    }
    logTerminal(logChannel, `Start drawing dependencies for ${editor.document.fileName}`);
    const result = PrinceClient.callPrince(editor.document.fileName, "--dm");
    let deps = {};
    try {
        deps = JSON.parse(result);
    } catch (error) {
        // TODO: pyprince should give back a structured response, not a simple string. Maybe create a local server?
        logTerminal(logChannel, `Failed to parse json with error ${error}:\n${result}`);
        vscode.window.showErrorMessage(`Prince py deps cannot handle pyprince result: ${error}`);
        return;
    }

    logTerminal(logChannel, `Sending draw-dependencies for ${editor.document.fileName}`);
    panel.webview.postMessage({ command: "draw-dependencies", data: deps });

    logTerminal(logChannel, "Finished drawing dependencies");
}

function logTerminal(channel: vscode.OutputChannel, message: string): void {
    // use date-fns package in future?
    channel.appendLine(`${new Date().toISOString()} - ` + message);
}

function updateViewHtml(panel: vscode.WebviewPanel, mediaUri: vscode.Uri) {
    const webviewHtmlUri = vscode.Uri.joinPath(mediaUri, "index.html");
    const mediaSrcPath = panel.webview.asWebviewUri(mediaUri);
    console.log("Generating webview vs-prince");
    panel.webview.html = getWebviewContent(panel.webview, webviewHtmlUri, mediaSrcPath);
}

function getWebviewContent(webview: vscode.Webview, htmlPath: vscode.Uri, mediaUri: vscode.Uri): string {
    let contents = fs.readFileSync(htmlPath.fsPath, "utf-8");
    contents = contents.replace(/\${webview.cspSource}/g, webview.cspSource);
    contents = contents.replace(/\${mediaUri}/g, mediaUri.toString());
    const nonce = getNonce();
    contents = contents.replace(/\${nonce}/g, nonce);
    return contents;
}

function getNonce(): string {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
