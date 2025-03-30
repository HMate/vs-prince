import { Graphviz } from "@hpcc-js/wasm/graphviz";

import { DependencyGraphDescriptor } from "@ww/extensionMessages";
import { coord, Coord, mulCoord } from "@ww/utils";
import { WebviewStateHandler } from "@ww/WebviewStateHandler";
import { GraphVisualizationBuilder } from "./GraphVisualizationBuilder";
import { Box } from "./diagramElements/Box";
import { BaseElementsBuilder } from "./BaseElementsBuilder";

type HEX = `#${string}`;
type GVDrawColor = { op: "c"; grad: string; color: HEX };
type GVDrawEdgeColor = { op: "C"; grad: string; color: HEX };
type GVHDrawStyle = { op: "S"; style: string };
type GVHDrawArrowPoints = { op: "P"; pt: Array<Array<number>> };
type GVDrawEdgePoints = { op: "b"; points: Array<Array<number>> };
type GVDrawPoints = { op: "p"; points: Array<Array<number>> };
type GVLdrawFont = { op: "F"; size: number; face: string };
type GVLdrawText = { op: "T"; pt: Array<number>; align: string; text: string; width: number };

interface GraphVizNodeObject {
    height: string; // floating number as string, in inches
    width: string; // floating number as string, in inches
    label: string;
    name: string;
    pos: string; // comma separated floats: x,y in points
    shape: string; // eg: box
    _gvid: number;
    _draw_: Array<GVDrawColor | GVDrawPoints>;
    _ldraw_: Array<GVDrawColor | GVLdrawFont | GVLdrawText>;
}

interface GraphVizClusterObject {
    label: string;
    name: string;
    cluster: string; // true or false
    compound: string; // true or false
    edges: Array<number>;
    nodes: Array<number>;
    lheight: string; // floating number as string, in inches
    lp: string; // 2 comma separated floats: box center point
    lwidth: string; // floating number as string, in inches
    bb: string; // 4 comma separated floats in points unit: llx,lly,urx,ury - lowerleft, upperright
    nodesep: string; // floating number
    rankdir: "LR" | "TD";
    ranksep: number; // floating number
    splines: string; // eg "ortho"
    _gvid: number;
    _draw_: Array<GVDrawColor | GVDrawPoints>;
    _ldraw_: Array<GVDrawColor | GVDrawEdgeColor | GVLdrawText>;
}

type GraphVizEdgeDrawValue = GVDrawColor | GVDrawEdgePoints;
type GraphVizEdgeHDrawValue = GVDrawColor | GVLdrawFont | GVHDrawStyle | GVHDrawArrowPoints;

interface GraphVizEdgeObject {
    tail: number;
    head: number;
    name: string;
    pos: string; // svg path like: "e,181.54,166 91.556,251.1 91.556,219.39 91.556,166" # https://www.graphviz.org/docs/attr-types/splineType/
    _gvid: number;
    _draw_: Array<GraphVizEdgeDrawValue>;
    _hdraw_: Array<GraphVizEdgeHDrawValue>;
}

export class GraphVizDiagramBuilder {
    private readonly nodeColor = "#66bb11";
    private readonly packageColor = "#faecb6";

    // graphviz json gives width/height in inches, and pos in points. See https://oreillymedia.github.io/Using_SVG/guide/units.html
    private readonly pixelToInches = 1 / 96;
    private readonly inchToPixel = 96;
    private readonly pointsToPixel = 1.33;

    private bbTop = 0;

    private readonly debugBuilder: BaseElementsBuilder;

    private graphviz: Graphviz | undefined = undefined;
    private readonly boxes: { [name: string]: Box } = {};
    private readonly packageBoxes: { [name: string]: Box } = {};
    private edgeId = 0;
    private nodeDotLines: Array<string> = [];
    private edgeDotLines: Array<string> = [];
    private packageDotLines: Array<string> = [];

    public constructor(
        private readonly webview: WebviewStateHandler,
        private readonly baseBuilder: GraphVisualizationBuilder
    ) {
        this.debugBuilder = new BaseElementsBuilder(baseBuilder);
    }

    public async createDiagram(descriptor: DependencyGraphDescriptor): Promise<void> {
        if (this.baseBuilder == null) {
            return;
        }
        this.graphviz = await Graphviz.load();

        console.time("Time GraphViz Build");

        for (const packageName in descriptor.packages) {
            this.addPackage(packageName, descriptor.packages[packageName]);
        }
        for (const node of descriptor.nodes) {
            this.addNode(node);
        }
        for (const node in descriptor.edges) {
            if (Object.prototype.hasOwnProperty.call(descriptor.edges, node)) {
                const depList = descriptor.edges[node];
                for (const dep of depList) {
                    this.addEdge(node, dep);
                }
            }
        }
        const dot = this.createDotRepresentation();
        console.timeEnd("Time GraphViz Build");

        // const svg = graphviz.dot(dot, "svg");
        // document.getElementById("prince-svg")!.innerHTML += svg;

        let layoutJson;
        try {
            this.webview.messageToHost("Starting dot layout");
            console.time("Time GraphViz DotLayout");
            layoutJson = this.graphviz.dot(dot, "json");
            console.timeEnd("Time GraphViz DotLayout");
            this.webview.messageToHost("Finished dot layout");
        } catch (error) {
            if (error instanceof Error) {
                console.warn("There was a problem with the dot file: " + error.message);
                console.log(dot);
            }
            return;
        }
        console.time("Time GraphViz Parse");
        const gvLayout = JSON.parse(layoutJson);
        console.timeEnd("Time GraphViz Parse");
        console.log(gvLayout);

        console.time("Time GraphViz Draw");
        this.moveElementsBasedOnLayout(gvLayout);
        console.timeEnd("Time GraphViz Draw");
    }

    private addNode(node: string) {
        const b = this.baseBuilder.createBox({ name: node, boxStyle: { fill: this.nodeColor } });
        this.boxes[node] = b;
        const width = b.width() * this.pixelToInches;
        const height = b.height() * this.pixelToInches;
        this.nodeDotLines.push(`${this.toDotName(node)} [label="${node}" width=${width} height=${height}];`);
    }

    private addEdge(startNode: string, endNode: string) {
        const edgeName = `e${this.edgeId}__${this.toDotName(startNode)}__${this.toDotName(endNode)}`;
        this.edgeDotLines.push(`${this.toDotName(startNode)} -> ${this.toDotName(endNode)} [name=${edgeName}];`);
        this.edgeId++;
    }

    private addPackage(packageName: string, members: Array<string>) {
        const b = this.baseBuilder.createBox({ name: packageName, boxStyle: { fill: this.packageColor } });
        this.packageBoxes[packageName] = b;

        let packageDescription = `  subgraph ${this.toDotName(packageName)} {\n`;
        packageDescription += `    cluster=true; label="${packageName}"`;
        for (const member of members) {
            packageDescription += `    ${this.toDotName(member)};\n`;
        }
        packageDescription += `  }\n`;
        this.packageDotLines.push(packageDescription);
    }

    private toDotName(name: string): string {
        return name.replaceAll(".", "_");
    }

    private createDotRepresentation(): string {
        let dot = "digraph G { \n";
        dot += "compound=true;\n";
        dot += "splines=ortho\n";
        dot += "nodesep=0.02\n";
        dot += "ranksep=0.04\n";
        dot += 'node [shape="box"]\n';
        dot += "rankdir=LR\n";

        dot += this.packageDotLines.join("\n");
        dot += "\n";
        dot += this.nodeDotLines.join("\n");
        dot += "\n";
        dot += this.edgeDotLines.join("\n");

        dot += "}";
        // console.log(dot);
        return dot;
    }

    private moveElementsBasedOnLayout(gvLayout: any) {
        const nodeIds: { [id: number]: string } = {};
        const boundingBox: Array<number> = gvLayout["bb"]?.split(",").map((x: string) => parseFloat(x)); // llx,lly,urx,ury - lowerleft, upperright
        this.bbTop = boundingBox[3];

        // TODO: Object placement, size is all wrong
        // Create some generic tool so I can create text and marks for a ruler, and measure sizes of drawn objects visually
        // Then fix the sizes..
        this.drawDebugUnitScale(boundingBox);

        gvLayout.objects?.forEach((v: GraphVizNodeObject | GraphVizClusterObject) => {
            let b;
            if (v.label === "\\N") {
                // This is a new node, that wasn't in the original descriptor. So create a new box for it here.
                b = this.addNodeFromGraphvizData(v as GraphVizNodeObject, nodeIds);
            } else {
                b = this.boxes[v.label];
                if (b == null) {
                    this.updatePackageFromGraphvizData(v as GraphVizClusterObject);
                    return;
                }
                nodeIds[v._gvid] = v.label;
            }
            v = v as GraphVizNodeObject;
            this.updateNodeFromGraphvizData(b, v as GraphVizNodeObject);
        });

        gvLayout.edges?.forEach((edge: any) => {
            const startNode = nodeIds[edge.tail];
            const endNode = nodeIds[edge.head];
            if (startNode == null || endNode == null) {
                console.warn(`Did not find node ending [${edge.tail} ${edge.head}] for edge ${edge.name}`);
                return;
            }

            const cps = this.collectEdgeControlPoints(edge);
            if (cps.length >= 3) {
                this.webview.messageToHost(
                    `Create edge (${startNode}--${endNode}) from start ${cps[0]} to end ${cps[cps.length - 1]}`
                );
                this.baseBuilder.createEdge(
                    this.boxes[startNode],
                    this.boxes[endNode],
                    cps.slice(1, -1),
                    cps[0],
                    cps[cps.length - 1],
                    false
                );
            }
        });
    }

    private drawDebugUnitScale(boundingBox: Array<number>) {
        const [left, bottom, right, top] = boundingBox;
        this.webview.messageToHost(`GV Bounding box: left: ${left}, bottom: ${bottom}, right: ${right}, top: ${top}`);
        const bbTop = top * this.pointsToPixel;
        const violet = "#BB1199";
        const green = "#119922";

        this.debugBuilder.createText(
            "GV Points X",
            coord(left * this.pointsToPixel + 10, bbTop - bottom * this.pointsToPixel + 10)
        );
        const bbWidth = right - left;
        const bbXUnit = bbWidth / 20;
        for (let index = left; index < right; index = index + bbXUnit) {
            const start = index;
            const end = index + bbXUnit;
            this.debugBuilder.drawLineSegment(
                coord(start * this.pointsToPixel, bbTop - bottom * this.pointsToPixel),
                coord(end * this.pointsToPixel, bbTop - bottom * this.pointsToPixel),
                coord(0, 4),
                violet,
                end.toFixed(2).toString()
            );
        }

        this.debugBuilder.createText(
            "GV Points Y",
            coord(left * this.pointsToPixel - 10, (top - bottom) * this.pointsToPixel - 10)
        );
        const bbHeight = top - bottom;
        const bbYUnit = bbHeight / 20;
        for (let index = bottom; index < top; index = index + bbYUnit) {
            const start = index;
            const end = index + bbYUnit;
            this.debugBuilder.drawLineSegment(
                coord(left * this.pointsToPixel + 2, bbTop - start * this.pointsToPixel),
                coord(left * this.pointsToPixel + 2, bbTop - end * this.pointsToPixel),
                coord(6, 0),
                green,
                end.toFixed(2).toString()
            );
        }
    }

    private addNodeFromGraphvizData(node: GraphVizNodeObject, nodeIds: { [id: number]: string }) {
        const b = this.baseBuilder.createBox({ name: node.name, boxStyle: { fill: this.nodeColor } });
        this.boxes[node.name] = b;
        nodeIds[node._gvid] = node.name;
        return b;
    }

    private updateNodeFromGraphvizData(box: Box, node: GraphVizNodeObject) {
        const pos = node.pos.split(",").map((s: string) => parseFloat(s));
        box.setWidth(parseFloat(node.width) * this.inchToPixel);
        box.setHeight(parseFloat(node.height) * this.inchToPixel);
        const centerPos = this.graphVizPointToSceneCoord(pos[0], pos[1]);
        box.moveCenter(centerPos.x, centerPos.y);

        this.webview.messageToHost(
            `Moving node ${node.name} to ${centerPos} (derived from (${pos[0]}, ${pos[1]}) gv point`
        );
    }

    private updatePackageFromGraphvizData(node: GraphVizClusterObject) {
        const b = this.packageBoxes[node.label];

        const [left, bottom, right, top] = node.bb.split(",");
        const width = (parseFloat(right) - parseFloat(left)) * this.pointsToPixel;
        const height = (parseFloat(top) - parseFloat(bottom)) * this.pointsToPixel;
        b.setWidth(width);
        b.setHeight(height);

        // TODO: There should be a "pos" instead of lp in cluster too, right?
        const [cx, cy] = node.lp.split(",");
        const center = this.graphVizPointToSceneCoord(parseFloat(cx), parseFloat(cy));
        b.moveCenter(center.x, center.y);
        return b;
    }

    private collectEdgeControlPoints(edge: GraphVizEdgeObject): Array<Coord> {
        let cps: Array<Coord> = [];

        const edgePointsOption = this.findPointListField(edge["_draw_"], "b") as GVDrawEdgePoints | undefined;
        const arrowPointsOption = this.findPointListField(edge["_hdraw_"], "p") as GVDrawPoints | undefined;

        if (edgePointsOption && "points" in edgePointsOption) {
            this.webview.messageToHost(
                `Edge (${edge.name}) points: ${edgePointsOption.points.map((p) => coord(p[0], p[1]))}`
            );
            cps = (edgePointsOption.points as Array<[number, number]>).map((p) => {
                return this.graphVizPointToSceneCoord(p[0], p[1]);
            });
        }
        if (arrowPointsOption && "points" in arrowPointsOption) {
            const arrowCps = (arrowPointsOption.points as Array<[number, number]>).map((p) =>
                this.graphVizPointToSceneCoord(p[0], p[1])
            );
            cps.push(arrowCps[1]);
        }
        return cps;
    }

    private graphVizPointToSceneCoord(p0: number, p1: number): Coord {
        return mulCoord(coord(p0, this.bbTop - p1), this.pointsToPixel);
    }

    private findPointListField(
        ar: Array<GraphVizEdgeHDrawValue> | Array<GraphVizEdgeDrawValue> | undefined,
        opCode: string
    ) {
        if (ar == null) {
            return undefined;
        }
        for (const option of ar) {
            if (option.op === opCode || option.op === opCode.toUpperCase()) {
                return option;
            }
        }
        return undefined;
    }
}
