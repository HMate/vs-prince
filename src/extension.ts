import * as vscode from "vscode";
import { PyPrince } from "@mhidvegi/pyprince";
import { WebviewSerializer } from "./WebviewSerializer";
import { AppState } from "./AppState";

/** TODO - For release 0.1:
 * - Create package npm for pyprince
 * - Create vscode package for vsc-prince
 * - Fix pyprince to not run top level statements
 */

export function activate(context: vscode.ExtensionContext): void {
    const app = new AppState(context);

    const logChannel = vscode.window.createOutputChannel("VSPrince");
    logTerminal(logChannel, "Command vs-prince activated");

    const disposable = vscode.commands.registerCommand("vs-prince.visualize-py-deps", () => {
        try {
            if (app.panel == null) {
                const workspaceUris = vscode.workspace.workspaceFolders?.map((dir) => dir.uri) ?? [];
                app.panel = vscode.window.createWebviewPanel("princeViz", "Prince", vscode.ViewColumn.Active, {
                    enableScripts: true,
                    localResourceRoots: [app.mediaUri].concat(workspaceUris),
                });

                app.initPanel();

                drawPythonDependencies(logChannel, app.panel);
            } else {
                app.panel.reveal(vscode.window.activeTextEditor?.viewColumn);
                drawPythonDependencies(logChannel, app.panel);
            }
        } catch (error) {
            if (error instanceof Error) {
                logTerminalRaw(logChannel, `Prince py deps run into error: ${error.stack}`);
            } else {
                logTerminal(logChannel, `Prince py deps run into error: ${error}`);
            }
            vscode.window.showErrorMessage(`Prince py deps run into error: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
    vscode.window.registerWebviewPanelSerializer("princeViz", new WebviewSerializer(app));
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
    // TODO: Get active python env from vscode and pass it to PyPrince here
    const result = new PyPrince().callPrince(editor.document.fileName, "--dm");
    let deps = {};
    try {
        deps = JSON.parse(result);
    } catch (error) {
        // TODO: pyprince should give back a structured response, not a simple string. Maybe create a local server?
        logTerminalRaw(logChannel, `Failed to parse json with error ${error}:\n${result}\n`);
        vscode.window.showErrorMessage(`Prince py deps cannot handle pyprince result: ${error}`);
        return;
    }

    logTerminal(logChannel, `Sending draw-dependencies for ${editor.document.fileName}`);
    panel.webview.postMessage({ command: "draw-dependencies", data: deps });

    logTerminal(logChannel, "Finished drawing dependencies");
}

function logTerminalRaw(channel: vscode.OutputChannel, message: string): void {
    // use date-fns package in future?
    channel.append(`${new Date().toISOString()} - ` + message);
}

function logTerminal(channel: vscode.OutputChannel, message: string): void {
    // use date-fns package in future?
    channel.appendLine(`${new Date().toISOString()} - ` + message);
}
