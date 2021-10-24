import * as assert from "assert";

import { Graph } from "../../webview/graph/Graph";
import { LayoutEngine, OrganizationEngine } from "../../webview/graph/LayoutEngine";

describe("Layout Organization", () => {
    describe("with two nodes and a single edge", () => {
        let graph = new Graph();
        graph.addNode({ name: "Aron", width: 30, height: 30 });
        graph.addNode({ name: "Bill", width: 30, height: 30 });

        graph.addEdge({ start: "Aron", end: "Bill" });

        let layers = OrganizationEngine.organize(graph);

        it("should have 2 layers", () => {
            assert.strictEqual(2, layers.length);
        });

        it("should have 1 node in each layer", () => {
            assert.strictEqual(1, layers[0].length);
            assert.strictEqual(1, layers[1].length);
        });
    });
});
