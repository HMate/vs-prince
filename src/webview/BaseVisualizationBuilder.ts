import { Box, BoxDescription } from "./baseElements/Box";
import { Edge } from "./baseElements/Edge";
import { SvgVisualizationBuilder } from "./SvgVisualizationBuilder";
import { Coord } from "./utils";

export class BaseVisualizationBuilder extends SvgVisualizationBuilder {
    public createBox(desc?: BoxDescription): Box {
        return new Box(this, this.tts, desc);
    }

    public createEdge(start: Box, end: Box, controlPoints: Coord[] = []): Edge {
        return new Edge(this, start, end, controlPoints);
    }
}
