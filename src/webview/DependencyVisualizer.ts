import dagre from "dagre";

import { BaseVisualizationBuilder } from "./BaseVisualizationBuilder";
import { DrawDependenciesMessage } from "./extensionMessages";
import { Box } from "./baseElements/Box";

export function drawDependencies(baseBuilder: BaseVisualizationBuilder, message: DrawDependenciesMessage) {
    if (baseBuilder == null) {
        return;
    }

    var g = new dagre.graphlib.Graph();
    g.setGraph({});
    g.setDefaultEdgeLabel(function () {
        return {};
    });

    // create the boxes, because we need their sizes:
    // TODO: Draw edges
    let boxes: { [name: string]: Box } = {};
    for (const node of message.data.nodes) {
        let b = baseBuilder.createBox({ name: node });
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

    dagre.layout(g);
    g.nodes().forEach(function (v) {
        let node = g.node(v);
        let b = boxes[v];
        b.move(node.x, node.y);
    });

    g.edges().forEach(function (edge) {
        baseBuilder.createEdge(boxes[edge.v], boxes[edge.w]);
    });
}
