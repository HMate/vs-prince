import { expect } from "chai";

import { Graph } from "../../webview/graph/Graph";
import { OrganizationEngine } from "../../webview/graph/cyclicTreeGraph/OrganizationEngine";

describe("Layout Organization", () => {
    describe("with single node", () => {
        const graph = new Graph();
        graph.addNode({ name: "Aron", width: 30, height: 30 });
        const layers = OrganizationEngine.organize(graph);

        it("should have single layer", () => {
            expect(layers).to.have.length(1);
            expect(layers[0]).to.have.length(1);
        });
    });

    describe("with two nodes and a single edge", () => {
        const graph = new Graph();
        graph.addNode({ name: "Aron", width: 30, height: 30 });
        graph.addNode({ name: "Bill", width: 30, height: 30 });

        graph.addEdge({ start: "Aron", end: "Bill" });

        const layers = OrganizationEngine.organize(graph);

        it("should have 2 layers", () => {
            expect(layers).to.have.length(2);
        });

        it("should have 1 node in each layer", () => {
            expect(layers[0]).to.have.length(1);
            expect(layers[1]).to.have.length(1);
        });
    });

    describe("with 3 nodes on 3 layers", () => {
        const graph = new Graph();
        graph.addNode({ name: "Aron", width: 30, height: 30 });
        graph.addNode({ name: "Bill", width: 30, height: 30 });
        graph.addNode({ name: "Celine", width: 30, height: 30 });

        graph.addEdge({ start: "Aron", end: "Bill" });
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
    });

    describe("with dependency through multiple layers", () => {
        const graph = new Graph();
        // prettier-ignore
        addNodes(graph, 
            "Dep11", 
            "Dep21", 
            "Dep31", 
            "Dep41", "Dep42",
        );

        addDeps(graph, "Dep11", ["Dep21", "Dep42"]);
        addDeps(graph, "Dep21", ["Dep31"]);
        addDeps(graph, "Dep31", ["Dep41", "Dep42"]);

        const layers = OrganizationEngine.organize(graph);

        it("should have 2 nodes in last layer", () => {
            expect(layers[3].length).to.equal(2);
        });

        it("should have nodes 'Dep41' and 'Dep42' in last layer", () => {
            expect(layers[3]).to.have.members(["Dep41", "Dep42"]);
        });
    });

    describe("with many nodes without cycle", () => {
        const graph = new Graph();

        // prettier-ignore
        addNodes(graph,
            "Dep11", "Dep12", "Dep13",
            "Dep21", "Dep22", "Dep23", "Dep24", "Dep25", "Dep26", "Dep27",
            "Dep31", "Dep32", "Dep33", "Dep34",
            "Dep41", "Dep42",
            "Dep51", "Dep52",
            "Dep61",
            "Dep71"
        );

        addDeps(graph, "Dep11", ["Dep21", "Dep22", "Dep23", "Dep24", "Dep27", "Dep51"]);
        addDeps(graph, "Dep12", ["Dep24", "Dep25", "Dep26"]);

        addDeps(graph, "Dep21", ["Dep31", "Dep32", "Dep33"]);
        addDeps(graph, "Dep22", ["Dep32", "Dep33", "Dep34"]);
        addDeps(graph, "Dep24", ["Dep32", "Dep33"]);
        addDeps(graph, "Dep27", ["Dep33"]);

        addDeps(graph, "Dep32", ["Dep41", "Dep42"]);
        addDeps(graph, "Dep33", ["Dep41", "Dep42"]);
        addDeps(graph, "Dep34", ["Dep42"]);

        addDeps(graph, "Dep41", ["Dep52"]);
        addDeps(graph, "Dep42", ["Dep51"]);

        addDeps(graph, "Dep52", ["Dep61"]);
        addDeps(graph, "Dep61", ["Dep71"]);

        const layers = OrganizationEngine.organize(graph);

        it("should have 7 layers", () => {
            expect(layers).to.have.length(7);
        });
        it("should have layers with correct node count", () => {
            expect(layers[0]).to.have.length(3);
            expect(layers[1]).to.have.length(7);
            expect(layers[2]).to.have.length(4);
            expect(layers[3]).to.have.length(2);
            expect(layers[4]).to.have.length(2);
            expect(layers[5]).to.have.length(1);
            expect(layers[6]).to.have.length(1);
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
