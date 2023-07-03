import TextToSVG from "./TextToSvg";
import RobotoFont from "./font/RobotoMono.ttf";
import "./webview-style.scss";
import "@svgdotjs/svg.draggable.js";

import { BaseVisualizationBuilder } from "./BaseVisualizationBuilder";
import { BaseMessage, DrawDependenciesMessage } from "./extensionMessages";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { drawDependencies } from "./DependencyVisualizer";

let baseBuilder: BaseVisualizationBuilder;
export function main(mediaUri: string): void {
    // TODO: theming in css - https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content
    // and https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/docs/getting-started.md
    const _vscode = acquireVsCodeApi(); // This can be used to send messages to the extension if needed.
    showLoadingElement();
    TextToSVG.load(`${mediaUri}/${RobotoFont}`, (err: any, tts: TextToSVG | null) => {
        if (err || tts == null) {
            console.error(`Error while loading opentype text: ${err} | ${tts}`);
            return;
        }
        buildVisualization("prince-svg", tts);
    });
}

function buildVisualization(svgId: string, tts: TextToSVG) {
    baseBuilder = new BaseVisualizationBuilder(svgId, tts);
    baseBuilder.addCameraHandlers();
}

export async function onExtensionMessage(message: BaseMessage): Promise<void> {
    console.log("Got message " + message.command);
    if (baseBuilder == null) {
        console.log(`Base builder should not be undefined: ${baseBuilder}`);
        return;
    }

    if (message.command === "draw-dependencies") {
        await handleDrawDependenciesMessage(message as DrawDependenciesMessage);
        hideLoadingElement();
    } else if (message.command === "show-loading") {
        showLoadingElement();
    } else {
        console.log(`Unknown message command: ${message.command}`);
    }
}

function showLoadingElement(): void {
    document.getElementById("loading")!.style.display = "flex";
}

function hideLoadingElement(): void {
    document.getElementById("loading")!.style.display = "none";
}

async function handleDrawDependenciesMessage(message: DrawDependenciesMessage): Promise<void> {
    clearDiagram(baseBuilder);
    await drawDependencies(baseBuilder, message);
}

function clearDiagram(baseBuilder: BaseVisualizationBuilder) {
    baseBuilder.removeAllElements();
}
