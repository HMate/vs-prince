import { DependencyGraphDescriptor } from "@ww/scene/DependencyTypes";
import { Graph, NodeId, EdgeId } from "@ww/graph/Graph";
import { GraphLayoutEngine } from "@ww/graph/GraphLayoutEngine";
import { GraphVisualizationBuilder } from "./GraphVisualizationBuilder";
import { Box } from "./diagramElements/Box";

export function drawDependenciesCustom(
    baseBuilder: GraphVisualizationBuilder,
    descriptor: DependencyGraphDescriptor
): void {
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
