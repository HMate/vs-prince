import { Box, BoxDescription } from "./baseElements/Box";
import { SvgVisualizationBuilder } from "./SvgVisualizationBuilder";

export class BaseVisualizationBuilder extends SvgVisualizationBuilder {
    public createBox(desc?: BoxDescription): Box {
        return new Box(this, this.tts, desc);
    }
}
