import { Graph } from "./Graph";

export class LayoutEngine {
    public layoutCyclicTree(graph: Graph) {
        /* Have to:
        Build dependency graph. Nodes will be placed into layers.
        Nodes in layer 0 have no parents, ie no dependers depend on them.
        Nodes in layer 1 depend only on nodes in layer 0. This goes on for every layer.

          Layer 0                Layer 1
         __________           ____________
        |          |         |            |
        | depender |  -----> | dependency | 
        |__________|         |____________|

        Cyclic dependencies (CD) have to be handled with care. When a CD occurs, the parents who are 
        part of the cycle are ignored when we assign layers. So nodes in earlier layers 
        may depend on a later layers only when they are in a cycle.

        After dependency layers are decided, the order and position of nodes inside a layer have to be calculated.
        The order is based on minimizing the crossing of the edges between parent on the last layer and node in 
        current layer. The position is based on the position of the parent, and the count of siblings.

        Edges should be curved for backward edges. Their trajectory have to be computed. Nodes who are part of the 
        same cycle should be assinged to a group. The backward edges loop around the group.
        */
        let dependencies = this.gatherDependencies(graph);
    }

    private gatherDependencies(graph: Graph): DependencyGraph {
        let dependencyMap: { [parent: string]: Array<string> } = {};
        let dependerMap: { [child: string]: Array<string> } = {};
        for (const node of graph.nodes) {
            dependencyMap[node.name] = [];
            dependerMap[node.name] = [];
        }
        for (const edge of graph.edges) {
            dependencyMap[edge.start].push(edge.end);
            dependencyMap[edge.end].push(edge.start);
        }
        return { dependencies: dependencyMap, dependers: dependerMap };
    }

    private createLayers(dependencies: DependencyGraph): Array<Array<string>> {
        let layers: Array<Array<string>> = [];
        if (Object.keys(dependencies.dependencies).length === 0) {
            return layers;
        }
        layers.push([]);
        // have to collect every node who is part of a cycle. We ignore cycle members when assigning layers.
        // build layer 0
        for (const node in dependencies.dependers) {
            if (Object.prototype.hasOwnProperty.call(dependencies.dependers, node)) {
                const parents = dependencies.dependers[node]; // TODO: need only parents who are not in cycle
                if (parents.length === 0) {
                    layers[0].push(node);
                }
            }
        }

        // build other layers
        // TODO

        return layers;
    }
}

interface DependencyGraph {
    dependencies: { [parent: string]: Array<string> };
    dependers: { [child: string]: Array<string> };
}
