import { Graph } from "./Graph";

export class LayoutEngine {
    public layoutCyclicTree(graph: Graph) {
        /* Layout does 2 steps: Organization and Concretization.
        Organization consists of placing nodes into layers, without calculating node size, position or edge shape.
        Concretization will calculate these.

        Organization:
        First build dependency graph.
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
        return OrganizationEngine.organize(graph);
    }
}

export class OrganizationEngine {
    public static organize(graph: Graph) {
        let dependencies = OrganizationEngine.gatherImmediateNeighbours(graph);
        let cycles = OrganizationEngine.gatherCycles(dependencies);
        return OrganizationEngine.createLayers(dependencies, cycles);
    }

    public static gatherImmediateNeighbours(graph: Graph): ImmediateRelationships {
        let rel: ImmediateRelationships = { dependencies: {}, dependers: {} };
        for (const node of graph.nodes) {
            rel.dependers[node.name] = [];
            rel.dependencies[node.name] = [];
        }
        for (const edge of graph.edges) {
            rel.dependencies[edge.start].push(edge.end);
            rel.dependers[edge.end].push(edge.start);
        }
        return rel;
    }

    public static gatherCycles(relations: ImmediateRelationships) {
        // Naive: Start DFS from every node, record node path in every step.
        // If arrived to starting node, save it as cycle.
        // Optimization: Also detect if arrived in node that is also in the path.
        // Any node along the path is implicitly searched for all of its cycles,
        // so they are not needed to be checked later again.

        let visitedNodes: Array<NodeId> = [];
        let result: CycleRelationships = {};
        function dfsVisit(currentNode: NodeId, path: Array<NodeId>) {
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
            for (const dep in dependencies) {
                if (Object.prototype.hasOwnProperty.call(dependencies, dep)) {
                    dfsVisit(dep, Array.from(path));
                }
            }
        }
        for (const node in Object.keys(relations.dependencies)) {
            dfsVisit(node, []);
        }
        return result;
    }

    public static createLayers(relations: ImmediateRelationships, cycles: CycleRelationships): Array<Layer> {
        let layers: Array<Layer> = [];
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
    dependencies: { [parent: NodeId]: Array<NodeId> };
    dependers: { [child: NodeId]: Array<NodeId> };
}

type Cycle = Array<NodeId>;
type CycleRelationships = { [node: NodeId]: Array<Cycle> };
type Layer = Array<NodeId>;
type NodeId = string;
