import { expect } from "chai";

import { PrinceClient } from "../../PrinceClient";
import { Graph } from "../../webview/graph/Graph";
import { LayoutEngine, ConcreteGraphPositions } from "../../webview/graph/LayoutEngine";

describe("Test full dependecy layout", () => {
    describe("on parsed python dependencies", () => {
        let filename = "D:\\projects\\testing\\pylab\\main.py";
        let result = PrinceClient.callPrince(filename, "--dm");

        let deps = JSON.parse(result);
        let graph = new Graph();
        for (const node of deps.nodes) {
            graph.addNode({ name: node, width: 250.0, height: 60.0 });
        }

        for (const node in deps.edges) {
            if (Object.prototype.hasOwnProperty.call(deps.edges, node)) {
                const depList = deps.edges[node];
                for (const dep of depList) {
                    graph.addEdge({ start: node, end: dep });
                }
            }
        }

        let layout = new LayoutEngine();
        let positions: ConcreteGraphPositions = layout.layoutCyclicTree(graph);
        it("should have same number of positions as nodes", () => {
            expect(positions?.nodes()).to.have.length(deps.nodes.length);
        });
    });
});
