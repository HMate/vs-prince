import elk, { ElkExtendedEdge, ElkNode } from "elkjs";
import { Graphviz } from "@hpcc-js/wasm/graphviz";

import { GraphVisualizationBuilder } from "./GraphVisualizationBuilder";
import { DependencyGraphDescriptor } from "./extensionMessages";
import { Box } from "./graphVisualizationElements/Box";
import { Graph, NodeId, EdgeId, GraphNode } from "./graph/Graph";
import { GraphLayoutEngine } from "./graph/GraphLayoutEngine";
import { NestedGraph, NestedTreeLayout } from "./graph/layout/nestedTree/NestedTreeLayout";
import { Coord, addCoord, mulCoord } from "./utils";
import { WebviewStateHandler } from "./WebviewStateHandler";

export async function drawDependencies(
    viewState: WebviewStateHandler,
    baseBuilder: GraphVisualizationBuilder,
    descriptor: DependencyGraphDescriptor
): Promise<void> {
    await new GraphVizDiagramBuilder(viewState, baseBuilder).createDiagram(descriptor);
}

class GraphVizDiagramBuilder {
    private readonly pixelToInches = 1 / 96;
    private readonly inchToPixel = 96;
    private readonly pointsToPixel = 1.33;

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
    ) {}

    public async createDiagram(descriptor: DependencyGraphDescriptor): Promise<void> {
        if (this.baseBuilder == null) {
            return;
        }
        this.graphviz = await Graphviz.load();

        console.time("Time GraphViz Build");

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
        for (const packageName in descriptor.packages) {
            this.addPackage(packageName, descriptor.packages[packageName]);
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
        const b = this.baseBuilder.createBox({ name: node, boxStyle: { fill: "#66bb11" } });
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
        const b = this.baseBuilder.createBox({ name: packageName, boxStyle: { fill: "#faecb6" } });
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
        dot += this.nodeDotLines.join("\n");
        dot += this.edgeDotLines.join("\n");

        dot += "}";
        // console.log(dot);
        return dot;
    }

    private moveElementsBasedOnLayout(gvLayout: any) {
        const nodeIds: { [id: number]: string } = {};
        const origoY: number = gvLayout["bb"]?.split(",")[3];

        gvLayout.objects?.forEach((v: any) => {
            const b = this.boxes[v.label];
            if (b == null) {
                // TODO: create smaller packages to speed debugging up, and fix the calculations here.
                const [top, left, bottom, right] = v.bb.split(",");
                const b = this.packageBoxes[v.label];
                const width = (parseFloat(right) - parseFloat(left)) * this.inchToPixel;
                const height = (parseFloat(bottom) - parseFloat(top)) * this.inchToPixel;
                b.setWidth(width);
                b.setHeight(height);
                b.moveCenter(width / 2, height / 2);
                return;
            }
            nodeIds[v._gvid] = v.label;
            // graphviz json gives width/height in inches, and pos in points. See https://oreillymedia.github.io/Using_SVG/guide/units.html
            const pos = v.pos.split(",").map((s: string) => parseFloat(s) * this.pointsToPixel);
            b.setWidth(parseFloat(v.width) * this.inchToPixel);
            b.setHeight(parseFloat(v.height) * this.inchToPixel);
            b.moveCenter(pos[0] ?? 0, origoY * this.pointsToPixel - (pos[1] ?? 0));
        });

        gvLayout.edges?.forEach((edge: any) => {
            const startNode = nodeIds[edge.tail];
            const endNode = nodeIds[edge.head];
            if (startNode == null || endNode == null) {
                console.warn(`Did not find node ending [${edge.tail} ${edge.head}] for edge ${edge.name}`);
                return;
            }

            const cps = this.collectEdgeControlPoints(edge, origoY);
            if (cps.length >= 3) {
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

    private collectEdgeControlPoints(edge: any, origoY: number): Array<Coord> {
        let cps: Array<Coord> = [];

        const edgePointsOption = this.findPointListField(edge["_draw_"], "b");
        const arrowPointsOption = this.findPointListField(edge["_hdraw_"], "p");

        if (edgePointsOption && "points" in edgePointsOption) {
            cps = (edgePointsOption!.points as Array<[number, number]>).map((p) =>
                mulCoord({ x: p[0], y: origoY - p[1] }, this.pointsToPixel)
            );
        }
        if (arrowPointsOption && "points" in arrowPointsOption) {
            const arrowCps = (arrowPointsOption!.points as Array<[number, number]>).map((p) =>
                mulCoord({ x: p[0], y: origoY - p[1] }, this.pointsToPixel)
            );
            cps.push(arrowCps[1]);
        }
        return cps;
    }

    private findPointListField(ar: Array<{ ["op"]: string }> | undefined, opCode: string) {
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

async function _drawDependenciesElk(
    baseBuilder: GraphVisualizationBuilder,
    descriptor: DependencyGraphDescriptor
): Promise<void> {
    if (baseBuilder == null) {
        return;
    }

    console.time("Time ElkLayout CreateElements");
    const elkEngine = new elk();
    const g: ElkNode = {
        id: "root",
        layoutOptions: {
            "org.eclipse.elk.algorithm": "layered",
            "org.eclipse.elk.hierarchyHandling": "INCLUDE_CHILDREN",
            "org.eclipse.elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
            "org.eclipse.elk.direction": "RIGHT",
            "org.eclipse.elk.edgeRouting": "POLYLINE",
            "org.eclipse.elk.layered.feedbackEdges": "true",
            "org.eclipse.elk.layered.mergeEdges": "true",
        },
        children: [],
        edges: [],
    };

    // create the boxes, because we need their sizes
    const boxes: { [name: string]: Box } = {};
    for (const node of descriptor.nodes) {
        boxes[node] = baseBuilder.createBox({ name: node, boxStyle: { fill: "#66bb11" } });
    }

    const myGraph = createGraphFromMessage(descriptor);
    const compoundG: NestedGraph = NestedTreeLayout.assignSubGraphGroups(myGraph);

    for (const [graphId, graph] of Object.entries(compoundG.graphs)) {
        const compountNode: ElkNode = { id: graphId, children: [] };
        graph.nodes.forEach((node: GraphNode) => {
            const b = boxes[node.name];
            compountNode.children!.push({
                id: node.name,
                labels: [{ text: node.name }],
                width: b.width(),
                height: b.height(),
            });
        });
        g.children!.push(compountNode);
    }

    let edgeId = 0;
    for (const node in descriptor.edges) {
        if (Object.prototype.hasOwnProperty.call(descriptor.edges, node)) {
            const depList = descriptor.edges[node];
            for (const dep of depList) {
                g.edges?.push({ id: `e${edgeId}_${node}_${dep}`, sources: [node], targets: [dep] });
                edgeId++;
            }
        }
    }
    console.timeEnd("Time ElkLayout CreateElements");

    console.time("Time ElkLayout DoLayout");
    let graph: ElkNode;
    try {
        graph = await elkEngine.layout(g);
    } catch (layoutError) {
        console.error(layoutError);
        return;
    }
    console.timeEnd("Time ElkLayout DoLayout");

    console.time("Time ElkLayout MoveElements");
    const groupNodes: { [name: string]: Coord } = {};
    graph.children?.forEach((v) => {
        if (boxes[v.id] == null) {
            const parentX = v.x ?? 0;
            const parentY = v.y ?? 0;
            groupNodes[v.id] = { x: parentX, y: parentY };
            // Key is for a compound group node
            v.children?.forEach((child) => {
                const b = boxes[child.id];
                b.moveCenter(parentX + (child.x ?? 0) + b.width() / 2, parentY + (child.y ?? 0) + b.height() / 2);
            });
            return;
        }
        const b = boxes[v.id];
        b.moveCenter((v.x ?? 0) + b.width() / 2, (v.y ?? 0) + b.height() / 2);
    });

    graph.edges?.forEach(function (edge: ElkExtendedEdge) {
        let localOrigin: Coord = { x: 0, y: 0 };
        if ((edge as any).container !== "root") {
            localOrigin = groupNodes[(edge as any).container];
        }
        const section = edge.sections![0];
        const cps = section.bendPoints?.map((p) => addCoord(p, localOrigin)) ?? [];
        baseBuilder.createEdge(
            boxes[edge.sources[0]],
            boxes[edge.targets[0]],
            cps,
            addCoord(section.startPoint, localOrigin),
            addCoord(section.endPoint, localOrigin)
        );
    });
    console.timeEnd("Time ElkLayout MoveElements");
}

function _drawDependenciesCustom(baseBuilder: GraphVisualizationBuilder, descriptor: DependencyGraphDescriptor): void {
    if (baseBuilder == null) {
        return;
    }

    const graph = new Graph();

    console.time("Time CustomLayout CreateElements");
    // create the boxes, because we need their sizes:
    const boxes: { [name: NodeId]: Box } = {};
    for (const node of descriptor.nodes) {
        const b = baseBuilder.createBox({ name: node });
        boxes[node] = b;
        graph.addNode({ name: node, width: b.width(), height: b.height() / 2 });
    }

    for (const node in descriptor.edges) {
        if (Object.prototype.hasOwnProperty.call(descriptor.edges, node)) {
            const depList = descriptor.edges[node];
            for (const dep of depList) {
                graph.addEdge({ start: node, end: dep });
            }
        }
    }
    console.timeEnd("Time CustomLayout CreateElements");

    console.time("Time CustomLayout DoLayout");

    const layout = new GraphLayoutEngine();
    const positions = layout.layoutCyclicTree(graph);

    console.timeEnd("Time CustomLayout DoLayout");

    console.time("Time CustomLayout MoveElements");
    positions.nodes().forEach((nodeId: NodeId) => {
        const node = positions.nodePos(nodeId);
        const b = boxes[nodeId];
        b.moveCenter(node?.cx ?? 0, node?.cy ?? 0);
    });

    positions.edges().forEach((edge: EdgeId) => {
        const pos = positions.edgePos(edge);
        if (pos) {
            baseBuilder.createEdge(boxes[pos.start], boxes[pos.end]);
        }
    });
    console.timeEnd("Time CustomLayout MoveElements");
}

function createGraphFromMessage(descriptor: DependencyGraphDescriptor): Graph {
    const graph = new Graph();
    for (const node of descriptor.nodes) {
        graph.addNode({ name: node, width: 1, height: 1 });
    }
    for (const node in descriptor.edges) {
        if (Object.prototype.hasOwnProperty.call(descriptor.edges, node)) {
            const depList = descriptor.edges[node];
            for (const dep of depList) {
                graph.addEdge({ start: node, end: dep });
            }
        }
    }
    return graph;
}
