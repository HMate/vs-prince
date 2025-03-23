import { Graph, ConcreteGraph } from "@ww/graph/Graph";
import { CyclicTreeLayout } from "@ww/graph/layout/cyclicTree/CyclicTreeLayout";
import { NestedTreeLayout } from "@ww/graph/layout/nestedTree/NestedTreeLayout";

export class GraphLayoutEngine {
    public layoutCyclicTree(graph: Graph): ConcreteGraph {
        return new CyclicTreeLayout().arrange(graph);
    }

    public layoutNestedGraph(graph: Graph): void {
        return new NestedTreeLayout().arrange(graph);
    }
}
