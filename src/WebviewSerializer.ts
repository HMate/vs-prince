import * as vscode from "vscode";
import { AppState } from "@prince/AppState";

/** This class is needed by vscode to save/load webview states between vscode window restarts. */
export class WebviewSerializer implements vscode.WebviewPanelSerializer {
    constructor(private readonly app: AppState) {}
    async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: any): Promise<void> {
        // We just have to save the panel ref, and to reinitiliaze it, vscode will pass the state to it automatically.
        this.app.panel = webviewPanel;
        this.app.initPanel();
    }
}
