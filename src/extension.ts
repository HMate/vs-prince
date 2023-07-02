import * as vscode from "vscode";
import * as fs from "fs";
import { PrinceClient } from "./PrinceClient";

export function activate(context: vscode.ExtensionContext): void {
    let cachedPanel: vscode.WebviewPanel | null = null;

    const logChannel = vscode.window.createOutputChannel("VSPrince");
    logTerminal(logChannel, "Command vs-prince activated");

    const disposable = vscode.commands.registerCommand("vs-prince.visualize-py-deps", () => {
        const mediaUri = vscode.Uri.joinPath(context.extensionUri, "media");

        // TODO: Clicking off from the tab, then on again reloads the contents of the tab. We should cache the last content instead.
        if (cachedPanel == null) {
            const workspaceUris = vscode.workspace.workspaceFolders?.map((dir) => dir.uri) ?? [];
            cachedPanel = vscode.window.createWebviewPanel("princeViz", "Prince", vscode.ViewColumn.Active, {
                enableScripts: true,
                localResourceRoots: [mediaUri].concat(workspaceUris),
            });

            updateViewHtml(cachedPanel, mediaUri);

            cachedPanel.onDidDispose(() => {
                cachedPanel = null;
            });
            drawPythonDependencies(logChannel, cachedPanel);
        } else {
            cachedPanel.reveal(vscode.window.activeTextEditor?.viewColumn);
            drawPythonDependencies(logChannel, cachedPanel);
        }
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
    console.log("Command vs-prince deactivated");
}

function drawPythonDependencies(logChannel: vscode.OutputChannel, panel: vscode.WebviewPanel): void {
    logTerminal(logChannel, "Start drawing dependencies");

    const filename = "D:\\projects\\testing\\pylab\\main.py";
    const result = PrinceClient.callPrince(filename, "--dm");
    let deps = {};
    try {
        deps = JSON.parse(result);
    } catch (error) {
        logTerminal(logChannel, `Failed to parse json with error ${error}:\n${result}`);
        return;
    }

    logTerminal(logChannel, `Sending draw-dependencies for ${filename}`);
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
