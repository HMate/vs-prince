import TextToSVG from "./TextToSvg";
import "./font/RobotoMono.ttf";
import "./webview-style.scss";
import "@svgdotjs/svg.draggable.js";

import { BaseVisualizationBuilder } from "./BaseVisualizationBuilder";
import { BaseMessage, DrawDependenciesMessage } from "./extensionMessages";
import { drawDependencies, drawDependenciesDagre } from "./DependencyVisualizer";

let baseBuilder: BaseVisualizationBuilder;

export function main(mediaUri: string) {
    TextToSVG.load(`${mediaUri}/font/RobotoMono.ttf`, (err: any, tts: TextToSVG | null) => {
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

    let box = baseBuilder.createBox({
        name: "Balu kapitány",
        boxStyle: { fill: "#66bb11" },
        textStyle: { fontSize: "1000px" },
    });
}

export function onExtensionMessage(message: BaseMessage) {
    console.log("Got message " + message.command);
    if (baseBuilder == null) {
        console.log(`Base builder should not be undefined: ${baseBuilder}`);
        return;
    }

    if (message.command !== "draw-dependencies") {
        return;
    }
    clearDiagram(baseBuilder);
    drawDependencies(baseBuilder, message as DrawDependenciesMessage);
    //drawDependenciesDagre(baseBuilder, message as DrawDependenciesMessage);
}

function clearDiagram(baseBuilder: BaseVisualizationBuilder) {
    baseBuilder.removeAllElements();
}
