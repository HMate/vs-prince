import TextToSVG from "./TextToSvg";
import RobotoFont from "./resources/font/RobotoMono.ttf";
import "./webview-style.scss";
import "@svgdotjs/svg.draggable.js";

import { GraphVisualizationBuilder } from "./GraphVisualizationBuilder";
import { BaseMessage, DependencyGraphDescriptor, DrawDependenciesMessage } from "./extensionMessages";
import { drawDependencies } from "./DependencyVisualizer";
import { CURRENT_VIEW_STATE_VERSION, WebviewStateHandler } from "./WebviewStateHandler";

/** TODO - future features:
 * - Use GoJS!
 * - Highlight node parents/children with different colors if node is selected
 * - Handle Ctrl+Z to undo last action - currently that is only node dragging
 * - Create an entrypoint if a node was moved, the edges are updated, but the nodes remain fixed.
 * - Draw parent nodes for the group nodes
 * - Feature: Draw node layers by module structure - modules in project | 3rd party library modules | standard modules
 *   - Also compound node for modules containing further files?
 * - Feature: User can choose a layout that is not compound
 * - Feature: Select nodes. Highlight them and their parents/children.
 * - Feature: Expandable and closable nodes/group nodes
 * - Feature: Save/Load diagrams to/from files.
 */

let baseBuilder: GraphVisualizationBuilder;
let viewState!: WebviewStateHandler;

export function entrypoint(mediaUri: string): void {
    // Register to vscode messages
    window.addEventListener("message", (event) => onExtensionMessage(event.data));

    // TODO: theming in css - https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content
    // and https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/docs/getting-started.md

    viewState = new WebviewStateHandler(acquireVsCodeApi());

    showLoadingElement();
    TextToSVG.load(`${mediaUri}/${RobotoFont}`, (err: any, tts: TextToSVG | null) => {
        if (err || tts == null) {
            console.error(`Error while loading opentype text: ${err} | ${tts}`);
            return;
        }
        initVisualizationBuilder("prince-svg", tts, viewState);
    });
}

function initVisualizationBuilder(svgId: string, tts: TextToSVG, viewState: WebviewStateHandler) {
    baseBuilder = new GraphVisualizationBuilder(svgId, tts);
    baseBuilder.initCamera(saveViewState);
    baseBuilder.registerNodeMovementCallback(saveViewState);

    if (viewState.hasState()) {
        const state = viewState.getState();
        if (state != null && state.version === CURRENT_VIEW_STATE_VERSION) {
            baseBuilder.deserialize(state.sceneData);
            baseBuilder.setCamera(state.cameraState);
            hideLoadingElement();
        }
    }
}

export async function onExtensionMessage(message: BaseMessage): Promise<void> {
    console.log("Got message " + message.command);
    if (baseBuilder == null) {
        console.log(`Base builder should not be undefined: ${baseBuilder}`);
        return;
    }

    if (message.command === "draw-dependencies") {
        const descriptor = (message as DrawDependenciesMessage).data;
        console.time("Time DrawDependencies");
        await handleDrawDependenciesMessage(descriptor);
        console.timeEnd("Time DrawDependencies");
        console.time("Time SaveViewState");
        hideLoadingElement();
        saveViewState();
        console.timeEnd("Time SaveViewState");
    } else if (message.command === "show-loading") {
        showLoadingElement();
        viewState.clearState();
    } else {
        console.log(`Unknown message command: ${message.command}`);
    }
}

function saveViewState(): void {
    viewState.setState({
        version: CURRENT_VIEW_STATE_VERSION,
        sceneData: baseBuilder.serialize(),
        cameraState: baseBuilder.getCameraState(),
    });
}

function showLoadingElement(): void {
    document.getElementById("loading")!.style.display = "flex";
}

function hideLoadingElement(): void {
    document.getElementById("loading")!.style.display = "none";
}

async function handleDrawDependenciesMessage(descriptor: DependencyGraphDescriptor): Promise<void> {
    clearDiagram(baseBuilder);
    await drawDependencies(viewState, baseBuilder, descriptor);
}

function clearDiagram(baseBuilder: GraphVisualizationBuilder) {
    baseBuilder.removeAllElements();
}
