import TextToSVG from "./TextToSvg";
import "./font/RobotoMono.ttf";
import { SvgVisualizationBuilder } from "./SvgVisualizationBuilder";

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
    const builder = new SvgVisualizationBuilder(`#${svgId}`);
    builder.addCameraHandlers();
}
