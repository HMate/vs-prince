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

    // TODO: Box size calcutations
    // TODO: Draw edges
    for (const node of message.data.nodes) {
        // baseBuilder.createBox({ name: node });
        g.setNode(node, { label: node, width: node.length * 5, height: Box.defaultHeight / 2 });
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
        let b = baseBuilder.createBox({ name: v });
        b.move(node.x, node.y);
    });
}
