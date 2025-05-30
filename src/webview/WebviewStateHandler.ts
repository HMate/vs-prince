import { WebviewApi } from "vscode-webview";
import { GraphVisualizationDescription } from "@ww/drawing/GraphVisualizationBuilder";
import { CameraState } from "@ww/drawing/SvgVisualizationBuilder";

/** Can be used for tracking if the state was saved with a compatible version.
 * If CURRENT_VIEW_STATE_VERSION is changed, state saved in older versions of vsc-prince will be
 * lost or have to be handled with care. If PrinceViewState changes, this version should change as well. @see PrinceViewState */
export const CURRENT_VIEW_STATE_VERSION = "1";
export interface PrinceViewState {
    version: string;
    sceneData: GraphVisualizationDescription;
    cameraState: CameraState;
}

/** Can be used to send messages to the extension if needed, and to store state for webview panels */
export class WebviewStateHandler {
    constructor(private readonly vscode: WebviewApi<PrinceViewState>) {}

    hasState(): boolean {
        return this.vscode.getState() != null;
    }

    getState(): PrinceViewState | undefined {
        return this.vscode.getState();
    }

    setState(state: PrinceViewState): void {
        this.vscode.setState(state);
    }

    clearState(): void {
        this.vscode.setState(undefined);
    }

    /**
     * Logs message to browser console and to vscode output
     * @param message
     */
    messageToHost(message: string): void {
        console.log(`Sending message to host: ${message}`);
        this.vscode.postMessage({ command: "message", text: message });
    }

    /**
     * Logs error message to browser console, to vscode output, and shows error notification.
     * @param message
     */
    errorMessageToHost(message: string): void {
        console.warn(`Sending message to host: ${message}`);
        this.vscode.postMessage({ command: "errorMessage", text: message });
    }

    /**
     * Sends event to extension
     * @param message
     */
    eventToHost(eventName: string, message: string): void {
        console.log(`Sending event to host: ${eventName} - ${message}`);
        this.vscode.postMessage({ command: eventName, text: message });
    }
}
