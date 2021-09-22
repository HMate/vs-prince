import TextToSVG from "./TextToSvg";
import "./font/RobotoMono.ttf";
import "./webview-style.scss";
import { SvgVisualizationBuilder } from "./SvgVisualizationBuilder";
import "@svgdotjs/svg.draggable.js";
import { BaseVisualizationBuilder } from "./BaseVisualizationBuilder";

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
    const baseBuilder = new BaseVisualizationBuilder(svgId);
    baseBuilder.addCameraHandlers();

    let box = baseBuilder.createBox({
        name: "Balu kapitány",
        boxStyle: { fill: "#66bb11" },
        textStyle: { fontSize: "1000px" },
    });
}
