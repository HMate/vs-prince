import * as vscode from "vscode";
import { ContentLoader } from "@prince/ContentLoader";

/** Holds the state of the extension app. Also contains utility methods for extension specific paths. */
export class AppState {
    private cachedPanel: vscode.WebviewPanel | null = null;

    constructor(private readonly context: vscode.ExtensionContext) {}

    public get mediaUri(): vscode.Uri {
        return vscode.Uri.joinPath(this.context.extensionUri, "media");
    }

    public get panel(): vscode.WebviewPanel | null {
        return this.cachedPanel;
    }

    public set panel(target: vscode.WebviewPanel | null) {
        this.cachedPanel = target;
    }

    public initPanel(): void {
        if (this.panel == null) {
            throw new Error("Panel is null when trying to initialize it");
        }
        ContentLoader.updateViewHtml(this.panel, this.mediaUri);

        this.panel.onDidDispose(() => {
            // Fired when user closes the webview tab.
            this.panel = null;
        });
    }
}
