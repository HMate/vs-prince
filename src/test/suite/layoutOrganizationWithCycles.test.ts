import { expect } from "chai";

import { range } from "../../webview/utils";
import { Graph } from "../../webview/graph/Graph";
import { OrganizationEngine } from "../../webview/graph/cyclicTreeGraph/OrganizationEngine";

describe("Layout Organization with cycles", () => {
    describe("1. when single node depends on itself", () => {
        const graph = new Graph();
        graph.addNode({ name: "Aron", width: 30, height: 30 });
        graph.addEdge({ start: "Aron", end: "Aron" });

        const layers = OrganizationEngine.organize(graph);

        it("should have 1 layer", () => {
            expect(layers).to.have.length(1);
        });

        it("should have 1 node in layer", () => {
            expect(layers[0]).to.have.length(1);
        });
    });

    describe("2. when middle node depends on itself", () => {
        const graph = new Graph();
        addNodes(graph, "Aron", "Bill", "Celine");
        graph.addEdge({ start: "Aron", end: "Bill" });
        graph.addEdge({ start: "Bill", end: "Bill" });
        graph.addEdge({ start: "Bill", end: "Celine" });

        const layers = OrganizationEngine.organize(graph);

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
        const graph = new Graph();
        addNodes(graph, "Aron", "Bill", "Celine", "Dalma", "Ethan", "Fred");
        addCycle(graph, "Aron", "Bill", "Celine", "Dalma", "Ethan", "Fred");

        const layers = OrganizationEngine.organize(graph);

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
        const graph = new Graph();
        addNodes(graph, "Aron", "Bill", "Celine");

        graph.addEdge({ start: "Aron", end: "Bill" });
        addCycle(graph, "Bill", "Celine");

        const layers = OrganizationEngine.organize(graph);

        it("should have 3 layers", () => {
            expect(layers).to.have.length(3);
        });

        it("should have the following layers", () => {
            expect(layers[0]).to.eql(["Aron"]);
            expect(layers[1]).to.eql(["Bill"]);
            expect(layers[2]).to.eql(["Celine"]);
        });
    });

    describe("5. Test for node contained in 2 cycles", () => {
        const graph = new Graph();
        addNodes(graph, "Aron", "Bill", "Celine", "Dylan", "Erza");

        addCycle(graph, "Aron", "Celine", "Bill");
        addCycle(graph, "Dylan", "Celine", "Erza");

        const layers = OrganizationEngine.organize(graph);

        it("should have 4 layers", () => {
            expect(layers).to.have.length(4);
        });

        it("should have the following layers", () => {
            expect(layers[0]).to.have.members(["Aron"]);
            expect(layers[1]).to.have.members(["Celine"]);
            expect(layers[2]).to.have.members(["Bill", "Erza"]);
            expect(layers[3]).to.have.members(["Dylan"]);
        });
    });

    describe("6. Test for node contained in 3 cycles", () => {
        const graph = new Graph();
        addNodes(graph, "Aron", "Bill", "Celine", "Dylan", "Erza", "Fidgerald");

        addCycle(graph, "Aron", "Bill", "Celine");
        addCycle(graph, "Bill", "Dylan", "Erza");
        addCycle(graph, "Fidgerald", "Bill");

        const layers = OrganizationEngine.organize(graph);

        it("should have 4 layers", () => {
            expect(layers).to.have.length(4);
        });

        it("should have the following layers", () => {
            expect(layers[0]).to.have.members(["Aron"]);
            expect(layers[1]).to.have.members(["Bill"]);
            expect(layers[2]).to.have.members(["Celine", "Fidgerald", "Dylan"]);
            expect(layers[3]).to.have.members(["Erza"]);
        });
    });

    describe("7. Test for branch inside the cycle", () => {
        const graph = new Graph();
        addNodes(graph, "Aron", "Bill", "Celine");

        addCycle(graph, "Aron", "Bill");
        graph.addEdge({ start: "Aron", end: "Celine" });
        graph.addEdge({ start: "Celine", end: "Bill" });

        const layers = OrganizationEngine.organize(graph);

        it("should have 3 layers", () => {
            expect(layers).to.have.length(3);
        });

        it("should have the following layers", () => {
            expect(layers[0]).to.have.members(["Aron"]);
            expect(layers[1]).to.have.members(["Celine"]);
            expect(layers[2]).to.have.members(["Bill"]);
        });
    });
});

function addNodes(graph: Graph, ...nodes: string[]) {
    for (const node of nodes) {
        graph.addNode({ name: node, width: 30, height: 30 });
    }
}

/** @brief Add dependencies nodes[0] -> nodes[1] -> ... -> nodes[last] -> nodes[0] */
function addCycle(graph: Graph, ...nodes: string[]) {
    const size = nodes.length;
    for (const index of range(size)) {
        const start = nodes[index];
        const end = index + 1 === size ? nodes[0] : nodes[index + 1];
        graph.addEdge({ start: start, end: end });
    }
}
