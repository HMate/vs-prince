import { expect } from "chai";

import { range } from "../../webview/utils";
import { Graph } from "../../webview/graph/Graph";
import { LayoutEngine, OrganizationEngine } from "../../webview/graph/LayoutEngine";

describe("Layout Organization with cycles", () => {
    describe("1. when single node depends on itself", () => {
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

    describe("2. when middle node depends on itself", () => {
        let graph = new Graph();
        addNodes(graph, "Aron", "Bill", "Celine");
        graph.addEdge({ start: "Aron", end: "Bill" });
        graph.addEdge({ start: "Bill", end: "Bill" });
        graph.addEdge({ start: "Bill", end: "Celine" });

        let layers = OrganizationEngine.organize(graph);

        it("should have 3 layers", () => {
            expect(layers).to.have.length(3);
        });

        it("should have 1 node in each layer", () => {
            expect(layers[0]).to.have.length(1);
            expect(layers[1]).to.have.length(1);
            expect(layers[2]).to.have.length(1);
        });

        it("Bill should be on 2nd layer", () => {
            expect(layers[1]).to.contain("Bill");
        });
    });

    describe("3. when graph contains a single long cycle", () => {
        let graph = new Graph();
        addNodes(graph, "Aron", "Bill", "Celine", "Dalma", "Ethan", "Fred");
        addCycle(graph, "Aron", "Bill", "Celine", "Dalma", "Ethan", "Fred");

        let layers = OrganizationEngine.organize(graph);

        it("should have 6 layers", () => {
            expect(layers).to.have.length(6);
        });

        it("should have 1 node in each layer", () => {
            expect(layers[0]).to.have.length(1);
            expect(layers[1]).to.have.length(1);
            expect(layers[2]).to.have.length(1);
            expect(layers[3]).to.have.length(1);
            expect(layers[4]).to.have.length(1);
            expect(layers[5]).to.have.length(1);
        });
    });

    describe("4. when cycle starts in middle node", () => {
        let graph = new Graph();
        addNodes(graph, "Aron", "Bill", "Celine");

        graph.addEdge({ start: "Aron", end: "Bill" });
        addCycle(graph, "Bill", "Celine");

        let layers = OrganizationEngine.organize(graph);

        it("should have 3 layers", () => {
            expect(layers).to.have.length(3);
        });

        it("should have the following layers", () => {
            expect(layers[0]).to.eql(["Aron"]);
            expect(layers[1]).to.eql(["Bill"]);
            expect(layers[2]).to.eql(["Celine"]);
        });
    });

    // TODO: 5. Test for node contained in multiple (2,3,...) cycles
    // TODO: 6. Test for branch inside the cycle
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

/** @brief Add dependencies nodes[0] -> nodes[1] -> ... -> nodes[last] -> nodes[0] */
function addCycle(graph: Graph, ...nodes: string[]) {
    const size = nodes.length;
    for (const index of range(size)) {
        let start = nodes[index];
        let end = index + 1 === size ? nodes[0] : nodes[index + 1];
        graph.addEdge({ start: start, end: end });
    }
}
