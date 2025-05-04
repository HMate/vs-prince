import TextToSVG from "@ww/TextToSvg";
import RobotoFont from "@ww/resources/font/RobotoMono.ttf";

import "@ww/webview-style.scss";
import "@svgdotjs/svg.draggable.js";

import { GraphVisualizationBuilder } from "@ww/drawing/GraphVisualizationBuilder";
import { BaseMessage, DrawDependenciesMessage } from "@ww/extensionMessages";
import { DependencyGraphDescriptor } from "@ww/scene/DependencyTypes";
import { drawDependencies } from "@ww/drawing/DependencyVisualizer";
import { CURRENT_VIEW_STATE_VERSION, WebviewStateHandler } from "@ww/WebviewStateHandler";
import { DependencyModelManager } from "@prince/webview/scene/DependencyModelManager";

/** TODO - future features:
 * - Feature: Expandable and closable nodes/group nodes
 *      - Add vscode menu buttons / webview buttons, and handle with commands / message passing between extension and webview
 * - Feature: Draw node layers by module structure - modules in project | 3rd party library modules | standard modules
 *      - Also compound node for modules containing further files?
 * - Tech - Move dependency model logic entirely to python side? --> Needs "language" server
 * - Tech - unittest, integration tests. Have to figure out how to test graphs in a sane manner.
 *      - Or this remains only for message passing / server calling code, and we dont test drawing?
 * - Feature: Select nodes. Highlight them and their parents/children.
 * - Handle Ctrl+Z to undo last action - currently that is only node dragging
 * - Feature: User can choose a layout that is not compound
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
        console.log("load textToSvg finished");
        if (err || tts == null) {
            console.error(`Error while loading opentype text: ${err} | ${tts}`);
            return;
        }
        initVisualizationBuilder("prince-svg", tts, viewState);
        viewState.eventToHost("viewReady", "View is ready");
    });
}

function initVisualizationBuilder(svgId: string, tts: TextToSVG, viewState: WebviewStateHandler) {
    console.log("initVisualizationBuilder");
    baseBuilder = new GraphVisualizationBuilder(svgId, tts);
    baseBuilder.initCamera(saveViewState);
    baseBuilder.registerNodeMovementCallback(saveViewState);

    if (viewState.hasState()) {
        console.log("init - has state");
        const state = viewState.getState();
        if (state != null && state.version === CURRENT_VIEW_STATE_VERSION) {
            console.log("init - deserializing previous state");
            baseBuilder.deserialize(state.sceneData);
            baseBuilder.setCamera(state.cameraState);
            hideLoadingElement();
        }
    }
}

export async function onExtensionMessage(message: BaseMessage): Promise<void> {
    try {
        viewState.messageToHost("Got message " + message.command);
        if (baseBuilder == null) {
            viewState.errorMessageToHost(`Base builder should not be undefined: ${baseBuilder}`);
            return;
        }

        if (message.command === "draw-dependencies") {
            const descriptor = (message as DrawDependenciesMessage).data;

            console.time("Time DependencyModelManager");
            // const sceneDescriptor = new DependencyModelManager().hideStandardLibrary(descriptor);
            const sceneDescriptor = descriptor;
            console.timeEnd("Time DependencyModelManager");

            console.time("Time DrawDependencies");
            await handleDrawDependenciesMessage(sceneDescriptor);
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
    } catch (err: any) {
        hideLoadingElement();
        viewState.errorMessageToHost(`Got error during ${message.command}: ${err.stack}`);
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
