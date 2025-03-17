import * as vscode from "vscode";

import { WebviewSerializer } from "./WebviewSerializer";
import { AppState } from "./AppState";
import { Logger } from "./Logger";
import { PythonController } from "./PythonController";

export function activate(context: vscode.ExtensionContext): void {
    const app = new AppState(context);

    const logger = new Logger("VSPrince");
    logger.log("Command vs-prince activated");

    const pythonController = new PythonController(logger);

    // Consider implementing a custom editor for diagram file types?
    // https://code.visualstudio.com/api/references/contribution-points#contributes.customEditors?

    const disposable = vscode.commands.registerCommand("vs-prince.visualize-py-deps", async () => {
        try {
            if (app.panel == null) {
                const workspaceUris = vscode.workspace.workspaceFolders?.map((dir) => dir.uri) ?? [];
                app.panel = vscode.window.createWebviewPanel("princeViz", "Prince", vscode.ViewColumn.Active, {
                    enableScripts: true,
                    localResourceRoots: [app.mediaUri].concat(workspaceUris),
                });
                app.panel.webview.onDidReceiveMessage((message) => {
                    switch (message.command) {
                        case "message":
                            logger.log(message.text);
                            break;
                        default:
                            break;
                    }
                });

                app.initPanel();

                await pythonController.drawPythonDependencies(app.panel);
            } else {
                app.panel.reveal(vscode.window.activeTextEditor?.viewColumn);
                await pythonController.drawPythonDependencies(app.panel);
            }
        } catch (error) {
            if (error instanceof Error) {
                logger.logRaw(`Prince py deps run into error: ${error.stack}`);
            } else {
                logger.log(`Prince py deps run into error: ${error}`);
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
