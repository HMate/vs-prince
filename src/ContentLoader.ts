import * as vscode from "vscode";
import * as fs from "fs";

/** Loads and updates the html content of webviews */
export class ContentLoader {
    public static updateViewHtml(panel: vscode.WebviewPanel, mediaUri: vscode.Uri): void {
        const webviewHtmlUri = vscode.Uri.joinPath(mediaUri, "index.html");
        const mediaSrcPath = panel.webview.asWebviewUri(mediaUri);
        console.log("Generating webview vs-prince");
        panel.webview.html = this.loadWebviewContent(panel.webview, webviewHtmlUri, mediaSrcPath);
    }

    public static loadWebviewContent(webview: vscode.Webview, htmlPath: vscode.Uri, mediaUri: vscode.Uri): string {
        let contents = fs.readFileSync(htmlPath.fsPath, "utf-8");
        contents = contents.replace(/\${webview.cspSource}/g, webview.cspSource);
        contents = contents.replace(/\${mediaUri}/g, mediaUri.toString());
        const nonce = this.getNonce();
        contents = contents.replace(/\${nonce}/g, nonce);
        return contents;
    }

    private static getNonce(): string {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
