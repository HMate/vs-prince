import elk, { ElkExtendedEdge, ElkNode } from "elkjs";

import { GraphVisualizationBuilder } from "../GraphVisualizationBuilder";
import { DependencyGraphDescriptor } from "../extensionMessages";
import { Box } from "../graphVisualizationElements/Box";
import { Graph, GraphNode } from "../graph/Graph";
import { NestedGraph, NestedTreeLayout } from "../graph/layout/nestedTree/NestedTreeLayout";
import { Coord, addCoord } from "../utils";

export async function drawDependenciesElk(
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
