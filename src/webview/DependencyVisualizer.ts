import elk, { ElkNode } from "elkjs";

import { BaseVisualizationBuilder } from "./BaseVisualizationBuilder";
import { DrawDependenciesMessage } from "./extensionMessages";
import { Box } from "./baseElements/Box";
import { Graph, NodeId, EdgeId, GraphNode } from "./graph/Graph";
import { GraphLayoutEngine } from "./graph/GraphLayoutEngine";
import { NestedGraph, NestedGraphLayoutEngine } from "./graph/NestedGraphLayoutEngine";

export function drawDependencies(baseBuilder: BaseVisualizationBuilder, message: DrawDependenciesMessage): void {
    if (baseBuilder == null) {
        return;
    }

    const graph = new Graph();

    // create the boxes, because we need their sizes:
    const boxes: { [name: NodeId]: Box } = {};
    for (const node of message.data.nodes) {
        const b = baseBuilder.createBox({ name: node });
        boxes[node] = b;
        graph.addNode({ name: node, width: b.width(), height: b.height() / 2 });
    }

    for (const node in message.data.edges) {
        if (Object.prototype.hasOwnProperty.call(message.data.edges, node)) {
            const depList = message.data.edges[node];
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
        b.move(node?.cx ?? 0, node?.cy ?? 0);
    });

    positions.edges().forEach((edge: EdgeId) => {
        const pos = positions.edgePos(edge);
        if (pos) {
            baseBuilder.createEdge(boxes[pos.start], boxes[pos.end]);
        }
    });
}

export function drawDependenciesElk(baseBuilder: BaseVisualizationBuilder, message: DrawDependenciesMessage): void {
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
            "org.eclipse.elk.direction": "RIGHT" /*DOWN, RIGHT*/,
            "org.eclipse.elk.edgeRouting": "SPLINES",
        },
        children: [],
        edges: [],
    };

    // create the boxes, because we need their sizes
    const boxes: { [name: string]: Box } = {};
    for (const node of message.data.nodes) {
        boxes[node] = baseBuilder.createBox({ name: node });
    }

    const myGraph = createGraphFromMessage(message);
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
    for (const node in message.data.edges) {
        if (Object.prototype.hasOwnProperty.call(message.data.edges, node)) {
            const depList = message.data.edges[node];
            for (const dep of depList) {
                g.edges?.push({ id: `e${edgeId}`, sources: [node], targets: [dep] });
                edgeId++;
            }
        }
    }

    elkEngine
        .layout(g)
        .then((graph) => {
            graph.children?.forEach((v) => {
                if (boxes[v.id] == null) {
                    const parentX = v.x ?? 0;
                    const parentY = v.y ?? 0;
                    // Key is for a compound group node
                    v.children?.forEach((child) => {
                        const b = boxes[child.id];
                        b.move(parentX + (child.x ?? 0) + b.width() / 2, parentY + (child.y ?? 0) + b.height() / 2);
                    });
                    return;
                }
                const b = boxes[v.id];
                b.move(v.x ?? 0, v.y ?? 0);
            });

            graph.edges?.forEach(function (edge) {
                console.log(edge.sections?.length);
                const cps = edge.sections![0].bendPoints ?? [];
                baseBuilder.createEdge(
                    boxes[edge.sources[0]],
                    boxes[edge.targets[0]],
                    cps.slice(1, cps.length - 1),
                    true
                );
            });
        })
        .catch((layoutError) => {
            console.error(layoutError);
        });
}

function createGraphFromMessage(message: DrawDependenciesMessage): Graph {
    const graph = new Graph();
    for (const node of message.data.nodes) {
        graph.addNode({ name: node, width: 1, height: 1 });
    }
    for (const node in message.data.edges) {
        if (Object.prototype.hasOwnProperty.call(message.data.edges, node)) {
            const depList = message.data.edges[node];
            for (const dep of depList) {
                graph.addEdge({ start: node, end: dep });
            }
        }
    }
    return graph;
}
