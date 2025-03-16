import * as vscode from "vscode";
import path from "path";

import { PythonExtension } from "@vscode/python-extension";
import { PyPrince } from "@mhidvegi/pyprince";
import { Logger } from "./Logger";

export class PythonController {
    public constructor(private readonly logger: Logger) {}

    public async drawPythonDependencies(panel: vscode.WebviewPanel): Promise<void> {
        panel.webview.postMessage({ command: "show-loading" });
        const editor = vscode.window.activeTextEditor;
        if (editor == null) {
            vscode.window.showInformationMessage("No active editor selected to show dependencies for.");
            return;
        }
        this.logger.log(`Start drawing dependencies for ${editor.document.fileName}`);
        const start = performance.now();

        const workspaces = vscode.workspace.workspaceFolders;
        if (!this.isValidWorkspace(workspaces)) {
            return;
        }

        const cachePath = this.findPyprinceCachePath(workspaces);
        const pythonEnv = await this.getPythonEnv(editor);
        const result = new PyPrince(pythonEnv?.executable.uri?.fsPath).callPrince(
            editor.document.fileName,
            "--dm",
            "--cache",
            cachePath
        );
        let deps = {};
        try {
            deps = JSON.parse(result);
        } catch (error) {
            // TODO: pyprince should give back a structured response, not a simple string. Maybe create a local server?
            this.logger.logRaw(`Failed to parse json with error ${error}:\n${result}\n`);
            vscode.window.showErrorMessage(`Prince py deps cannot handle pyprince result: ${error}`);
            return;
        }

        const end = performance.now();
        this.logger.log(`Sending draw-dependencies for ${editor.document.fileName}, parsing took ${end - start} ms`);
        panel.webview.postMessage({ command: "draw-dependencies", data: deps });

        this.logger.log("Finished collecting dependencies, and sent them to webview");
    }

    private isValidWorkspace(
        workspaces: readonly vscode.WorkspaceFolder[] | undefined
    ): workspaces is vscode.WorkspaceFolder[] {
        if (workspaces == null) {
            vscode.window.showWarningMessage("Must use a workspace for visualizing dependencies.");
            return false;
        }
        return true;
    }

    private findPyprinceCachePath(workspaces: readonly vscode.WorkspaceFolder[]) {
        const wsPath = workspaces[0].uri.fsPath;
        const cachePath = path.join(wsPath, ".pyprince/cache.json");
        this.logger.log(`Using workspace cache ${cachePath}`);
        return cachePath;
    }

    private async getPythonEnv(editor: vscode.TextEditor) {
        // Get active python interpreter from vscode python.
        const pythonApi: PythonExtension = await PythonExtension.api();
        const pythonEnvPath = pythonApi.environments.getActiveEnvironmentPath(editor.document.uri);
        const pythonEnv = await pythonApi.environments.resolveEnvironment(pythonEnvPath);
        return pythonEnv;
    }
}
