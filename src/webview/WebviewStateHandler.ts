import { WebviewApi } from "vscode-webview";
import { GraphVisualizationDescription } from "./GraphVisualizationBuilder";
import { CameraState } from "./SvgVisualizationBuilder";

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
}
