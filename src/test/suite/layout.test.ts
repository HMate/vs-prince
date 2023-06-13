import { expect } from "chai";

import { PrinceClient } from "../../PrinceClient";
import { Graph, ConcreteGraph } from "../../webview/graph/Graph";
import { GraphLayoutEngine } from "../../webview/graph/GraphLayoutEngine";

describe("Test full dependency layout", () => {
    describe("on parsed python dependencies", () => {
        const filename = "D:\\projects\\testing\\pylab\\main.py";
        const result = PrinceClient.callPrince(filename, "--dm");

        const deps = JSON.parse(result);
        const graph = new Graph();
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

        const layout = new GraphLayoutEngine();
        const positions: ConcreteGraph = layout.layoutCyclicTree(graph);
        it("should have same number of positions as nodes", () => {
            expect(positions?.nodes()).to.have.length(deps.nodes.length);
        });
    });
});
