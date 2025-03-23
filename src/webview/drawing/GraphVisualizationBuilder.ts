import { Box, BoxDescription } from "./diagramElements/Box";
import { Edge, EdgeDescription } from "./diagramElements/Edge";
import { SvgVisualizationBuilder } from "./SvgVisualizationBuilder";
import { Coord } from "@ww/utils";

export interface GraphVisualizationDescription {
    boxes: BoxDescription[];
    edges: EdgeDescription[];
}

/** Use this class to place graph elements into the scene, like nodes and edges.
 * The class itself uses the SvgVisualizationBuilder class to build the graph elements from low-level svg elements. */
export class GraphVisualizationBuilder extends SvgVisualizationBuilder {
    private graphElements = { boxes: new Array<Box>(), edges: new Array<Edge>() };
    private nodeMovementCallback?: (builder: this) => void;

    public registerNodeMovementCallback(callback: (builder: this) => void): void {
        this.nodeMovementCallback = callback;
    }

    public createBox(desc?: BoxDescription): Box {
        const box = new Box(this, this.tts, desc);
        this.graphElements.boxes.push(box);
        box.onMove((_box: Box) => {
            this.nodeMovementCallback?.(this);
        });
        return box;
    }

    public createEdge(
        start: Box,
        end: Box,
        controlPoints: Coord[] = [],
        startPoint?: Coord,
        endPoint?: Coord,
        isBSpline = false
    ): Edge {
        const edge = new Edge(this, start, end, controlPoints, startPoint, endPoint, isBSpline);
        this.graphElements.edges.push(edge);
        return edge;
    }

    public createPackageBox(desc?: BoxDescription): Box {
        const box = new Box(this, this.tts, desc);
        this.graphElements.boxes.push(box);
        box.onMove((_box: Box) => {
            this.nodeMovementCallback?.(this);
        });
        return box;
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
