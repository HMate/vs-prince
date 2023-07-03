import { Box, BoxDescription } from "./graphVisualizationElements/Box";
import { Edge, EdgeDescription } from "./graphVisualizationElements/Edge";
import { SvgVisualizationBuilder } from "./SvgVisualizationBuilder";
import { Coord } from "./utils";

export interface GraphVisualizationDescription {
    boxes: BoxDescription[];
    edges: EdgeDescription[];
}

export class GraphVisualizationBuilder extends SvgVisualizationBuilder {
    private graphElements = { boxes: new Array<Box>(), edges: new Array<Edge>() };
    public createBox(desc?: BoxDescription): Box {
        const box = new Box(this, this.tts, desc);
        this.graphElements.boxes.push(box);
        return box;
    }

    public createEdge(start: Box, end: Box, controlPoints: Coord[] = [], startPoint?: Coord, endPoint?: Coord): Edge {
        const edge = new Edge(this, start, end, controlPoints, startPoint, endPoint);
        this.graphElements.edges.push(edge);
        return edge;
    }

    public serialize(): GraphVisualizationDescription {
        const result = {
            boxes: this.graphElements.boxes.map((box) => box.serialize()),
            edges: this.graphElements.edges.map((edge) => edge.serialize()),
        };
        return result;
    }

    public deserialize(desc: GraphVisualizationDescription): void {
        const boxes = new Map<string, Box>();
        this.graphElements.boxes = [];
        for (const boxDesc of desc.boxes) {
            const box = this.createBox(boxDesc);
            boxes.set(box.name(), box);
        }
        this.graphElements.edges = [];
        for (const edgeDesc of desc.edges) {
            const start = boxes.get(edgeDesc.start);
            const end = boxes.get(edgeDesc.end);
            if (start && end) {
                this.createEdge(start, end, edgeDesc.controlPoints, edgeDesc.startPoint, edgeDesc.endPoint);
                continue;
            }
            console.error(`Cannot deserialize edge ${edgeDesc.start} -> ${edgeDesc.end}`);
        }
    }
}
