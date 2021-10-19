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
        let dependencies = this.gatherImmediateNeighbours(graph);
        let cycles = this.gatherCycles(dependencies);
        this.createLayers(dependencies, cycles);
    }

    private gatherImmediateNeighbours(graph: Graph): ImmediateRelationships {
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

    private gatherCycles(relations: ImmediateRelationships) {
        // Naive: Start DFS from every node, record node path in every step.
        // If arrived to starting node, save it as cycle.
        // Optimization: Also detect if arrived in node that is also in the path.
        // Any node along the path is implicitly searched for all of its cycles,
        // so they are not needed to be checked later again.

        let visitedNodes: Array<string> = [];
        let result: CycleRelationships = {};
        function dfsVisit(currentNode: string, path: Array<string>) {
            if (path.includes(currentNode)) {
                // Found cycle
                let nodeIndex = path.indexOf(currentNode);
                let cycle = path.slice(nodeIndex);
                for (const node of cycle) {
                    if (result[node] === undefined) {
                        result[node] = [];
                    }
                    result[node].push(cycle);
                }
            }
            if (visitedNodes.includes(currentNode)) {
                return;
            }
            visitedNodes.push(currentNode);
            path.push(currentNode);
            const dependencies = relations.dependencies[currentNode];
            for (const dep of dependencies) {
                dfsVisit(dep, Array.from(path));
            }
        }
        for (const node in Object.keys(relations.dependencies)) {
            dfsVisit(node, []);
        }
        return result;
    }

    private createLayers(relations: ImmediateRelationships, cycles: CycleRelationships): Array<Array<string>> {
        let layers: Array<Array<string>> = [];
        if (Object.keys(relations.dependencies).length === 0) {
            return layers;
        }
        layers.push([]);
        // have to collect every node who is part of a cycle. We ignore cycle members when assigning layers.
        // build layer 0
        for (const node in relations.dependers) {
            if (Object.prototype.hasOwnProperty.call(relations.dependers, node)) {
                const parents = relations.dependers[node]; // TODO: need only parents who are not in cycle
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

interface ImmediateRelationships {
    dependencies: { [parent: string]: Array<string> };
    dependers: { [child: string]: Array<string> };
}

type Cycle = string[];
type CycleRelationships = { [node: string]: Array<Cycle> };
