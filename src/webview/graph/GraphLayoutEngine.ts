import { Graph, ConcreteGraph } from "./Graph";
import { CyclicTreeLayout } from "./layout/cyclicTree/CyclicTreeLayout";
import { NestedTreeLayout } from "./layout/nestedTree/NestedTreeLayout";

export class GraphLayoutEngine {
    public layoutCyclicTree(graph: Graph): ConcreteGraph {
        return new CyclicTreeLayout().arrange(graph);
    }

    public layoutNestedGraph(graph: Graph): void {
        return new NestedTreeLayout().arrange(graph);
    }
}
