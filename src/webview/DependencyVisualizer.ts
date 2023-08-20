import elk, { ElkExtendedEdge, ElkNode } from "elkjs";
import { Graphviz } from "@hpcc-js/wasm/graphviz";

import { GraphVisualizationBuilder } from "./GraphVisualizationBuilder";
import { DependencyGraphDescriptor } from "./extensionMessages";
import { Box } from "./graphVisualizationElements/Box";
import { Graph, NodeId, EdgeId, GraphNode } from "./graph/Graph";
import { GraphLayoutEngine } from "./graph/GraphLayoutEngine";
import { NestedGraph, NestedGraphLayoutEngine } from "./graph/NestedGraphLayoutEngine";
import { Coord, addCoord, mulCoord } from "./utils";

export async function drawDependencies(
    baseBuilder: GraphVisualizationBuilder,
    descriptor: DependencyGraphDescriptor
): Promise<void> {
    await drawDependenciesGraphViz(baseBuilder, descriptor);
}

async function drawDependenciesGraphViz(
    baseBuilder: GraphVisualizationBuilder,
    descriptor: DependencyGraphDescriptor
): Promise<void> {
    if (baseBuilder == null) {
        return;
    }
    const graphviz = await Graphviz.load();
    const groupNodes: { [name: string]: Coord } = {};
    const boxes: { [name: string]: Box } = {};

    function toDotName(name: string): string {
        return name.replaceAll(".", "_");
    }

    let dot = "digraph G { \n";
    dot += 'node [shape="box"]\n';
    dot += "rankdir=LR\n";
    const pixelToInches = 1 / 96;
    const inchToPixel = 96;
    const pointsToPixel = 1.33;
    for (const node of descriptor.nodes) {
        const b = baseBuilder.createBox({ name: node, boxStyle: { fill: "#66bb11" } });
        boxes[node] = b;
        const width = b.width() * pixelToInches;
        const height = b.height() * pixelToInches;
        dot += `${toDotName(node)} [label="${node}" width=${width} height=${height}];\n`;
    }
    let edgeId = 0;
    for (const node in descriptor.edges) {
        if (Object.prototype.hasOwnProperty.call(descriptor.edges, node)) {
            const depList = descriptor.edges[node];
            for (const dep of depList) {
                const edgeName = `e${edgeId}__${toDotName(node)}__${toDotName(dep)}`;
                dot += `${toDotName(node)} -> ${toDotName(dep)} [name=${edgeName}];\n`;
                edgeId++;
            }
        }
    }

    dot += "}";
    // console.log(dot);

    // const svg = graphviz.dot(dot, "svg");
    // document.getElementById("prince-svg")!.innerHTML += svg;

    const layoutJson = graphviz.dot(dot, "json");
    const gvLayout = JSON.parse(layoutJson);
    const nodeIds: { [id: number]: string } = {};

    const origoY: number = gvLayout["bb"]?.split(",")[3];

    gvLayout.objects?.forEach((v: any) => {
        const b = boxes[v.label];
        if (b == null) {
            const parentX = v.x ?? 0;
            const parentY = v.y ?? 0;
            groupNodes[v.label] = { x: parentX, y: parentY };
            // Key is for a compound group node
            // v.children?.forEach((child) => {
            //     const b = boxes[child.id];
            //     b.moveCenter(parentX + (child.x ?? 0) + b.width() / 2, parentY + (child.y ?? 0) + b.height() / 2);
            // });
            return;
        }
        nodeIds[v._gvid] = v.label;
        // graphviz json gives width/height in inches, and pos in points. See https://oreillymedia.github.io/Using_SVG/guide/units.html
        const pos = v.pos.split(",").map((s: string) => parseFloat(s) * pointsToPixel);
        b.setWidth(parseFloat(v.width) * inchToPixel);
        b.setHeight(parseFloat(v.height) * inchToPixel);
        b.moveCenter(pos[0] ?? 0, origoY * pointsToPixel - (pos[1] ?? 0));
    });

    const findPointListField = (ar: Array<{ ["op"]: string }>, opCode: string) => {
        for (const option of ar) {
            if (option.op === opCode || option.op === opCode.toUpperCase()) {
                return option;
            }
        }
        return undefined;
    };

    gvLayout.edges?.forEach((edge: any) => {
        const startNode = nodeIds[edge.tail];
        const endNode = nodeIds[edge.head];
        if (startNode == null || endNode == null) {
            console.warn(`Did not find node ending [${edge.tail} ${edge.head}] for edge ${edge.name}`);
            return;
        }

        const edgePointsOption = findPointListField(edge["_draw_"], "b");
        const arrowPointsOption = findPointListField(edge["_hdraw_"], "p");
        let cps: Array<Coord> = [];

        if (edgePointsOption && "points" in edgePointsOption) {
            cps = (edgePointsOption!.points as Array<[number, number]>).map((p) =>
                mulCoord({ x: p[0], y: origoY - p[1] }, pointsToPixel)
            );
        }
        if (arrowPointsOption && "points" in arrowPointsOption) {
            const arrowCps = (arrowPointsOption!.points as Array<[number, number]>).map((p) =>
                mulCoord({ x: p[0], y: origoY - p[1] }, pointsToPixel)
            );
            cps.push(arrowCps[1]);
        }
        if (cps.length >= 3) {
            baseBuilder.createEdge(
                boxes[startNode],
                boxes[endNode],
                cps.slice(1, -1),
                cps[0],
                cps[cps.length - 1],
                true
            );
        }
    });
}

async function _drawDependenciesElk(
    baseBuilder: GraphVisualizationBuilder,
    descriptor: DependencyGraphDescriptor
): Promise<void> {
    if (baseBuilder == null) {
        return;
    }

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
    const compoundG: NestedGraph = NestedGraphLayoutEngine.assignSubGraphGroups(myGraph);

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

    let graph: ElkNode;
    try {
        graph = await elkEngine.layout(g);
    } catch (layoutError) {
        console.error(layoutError);
        return;
    }

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
}

function _drawDependenciesCustom(baseBuilder: GraphVisualizationBuilder, descriptor: DependencyGraphDescriptor): void {
    if (baseBuilder == null) {
        return;
    }

    const graph = new Graph();

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

    const layout = new GraphLayoutEngine();
    const positions = layout.layoutCyclicTree(graph);

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
