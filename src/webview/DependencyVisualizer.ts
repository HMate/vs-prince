import dagre from "dagre";

import { BaseVisualizationBuilder } from "./BaseVisualizationBuilder";
import { DrawDependenciesMessage } from "./extensionMessages";
import { Box } from "./baseElements/Box";
import { Graph, NodeId, EdgeId } from "./graph/Graph";
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

export function drawDependenciesDagre(baseBuilder: BaseVisualizationBuilder, message: DrawDependenciesMessage): void {
    if (baseBuilder == null) {
        return;
    }

    const g = new dagre.graphlib.Graph({ directed: true, compound: true });
    g.setGraph({ compound: true, align: "UR", rankdir: "TB" });
    g.setDefaultEdgeLabel(function () {
        return {};
    });

    // create the boxes, because we need their sizes
    const boxes: { [name: string]: Box } = {};
    for (const node of message.data.nodes) {
        const b = baseBuilder.createBox({ name: node });
        boxes[node] = b;
        g.setNode(node, { label: node, width: b.width(), height: b.height() / 2 });
    }

    for (const node in message.data.edges) {
        if (Object.prototype.hasOwnProperty.call(message.data.edges, node)) {
            const depList = message.data.edges[node];
            for (const dep of depList) {
                g.setEdge(node, dep);
            }
        }
    }

    const myGraph = createGraphFromMessage(message);
    const compoundG: NestedGraph = NestedGraphLayoutEngine.assignSubGraphGroups(myGraph);

    for (const [graphId, graph] of Object.entries(compoundG.graphs)) {
        let width = 2;
        let height = 2;
        graph.nodes.forEach((node) => {
            const b = boxes[node.name];
            width += b.width();
            height += b.height();
        });
        g.setNode(graphId, { label: graphId, width, height });
        graph.nodes.forEach((node) => {
            // const b = boxes[node.name];
            // g.setNode(node.name, { label: node.name, width: b.width(), height: b.height() / 2 });
            g.setParent(node.name, graphId);
        });
    }

    dagre.layout(g);

    g.nodes().forEach(function (v) {
        const node = g.node(v);
        if (boxes[v] == null) {
            return; // Key is for a compound group node, not a real node
        }
        const b = boxes[v];
        b.move(node.x, node.y);
    });

    g.edges().forEach(function (edge) {
        const cps = g.edge(edge).points;
        baseBuilder.createEdge(boxes[edge.v], boxes[edge.w], cps.slice(1, cps.length - 1));
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
