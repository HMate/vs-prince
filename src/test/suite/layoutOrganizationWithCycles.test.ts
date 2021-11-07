import * as assert from "assert";
import { expect } from "chai";

import { Graph } from "../../webview/graph/Graph";
import { LayoutEngine, OrganizationEngine } from "../../webview/graph/LayoutEngine";

describe("Layout Organization with cycles", () => {
    describe("single node depends on itself", () => {
        let graph = new Graph();
        graph.addNode({ name: "Aron", width: 30, height: 30 });
        graph.addEdge({ start: "Aron", end: "Aron" });

        let layers = OrganizationEngine.organize(graph);

        it("should have 1 layer", () => {
            expect(layers).to.have.length(1);
        });

        it("should have 1 node in layer", () => {
            expect(layers[0]).to.have.length(1);
        });
    });
});

function addNodes(graph: Graph, ...nodes: string[]) {
    for (const node of nodes) {
        graph.addNode({ name: node, width: 30, height: 30 });
    }
}

function addDeps(graph: Graph, root: string, nodes: string[]) {
    for (const node of nodes) {
        graph.addEdge({ start: root, end: node });
    }
}
