import { assert } from "console";
import { Graph } from "./Graph";

export class LayoutEngine {
    public layoutCyclicTree(graph: Graph) {
        /* Layout does 2 steps: Organization and Concretization.
        Organization consists of placing nodes into logical positions.
        For cyclic tree this means organize into layers, without calculating node size, position or edge shape.
        Concretization will calculate the concrete postions with size and positions.

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
    /** Logical positions calculation for cyclic tree graphs */
    public static organize(graph: Graph) {
        let dependencies = OrganizationEngine.gatherImmediateNeighbours(graph);
        let cycles = OrganizationEngine.gatherCycles(dependencies);
        return OrganizationEngine.createLayers(dependencies, cycles);
    }

    /** Make double-linked list of nodes, to easy to search for cycles, layers */
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

    public static gatherCycles(relations: ImmediateRelationships): CycleStore {
        // Naive: Start DFS from every node, record node path in every step.
        // If arrived to starting node, save it as cycle.
        // Optimization: Also detect if arrived in node that is also in the path.
        // Any node along the path is implicitly searched for all of its cycles,
        // so they are not needed to be checked later again.

        let visitedNodes: Array<NodeId> = [];
        let result = new CycleStore();
        function dfsVisit(currentNode: NodeId, path: Array<NodeId>) {
            if (path.includes(currentNode)) {
                // Found cycle
                let nodeIndex = path.indexOf(currentNode);
                let cycle = path.slice(nodeIndex);
                for (const node of cycle) {
                    let nodeCycles = result.getNodeCycles(node);
                    nodeCycles.paths.push(cycle);
                    for (const member of cycle) {
                        nodeCycles.nodes.add(member);
                    }
                    result.setNodeCycles(nodeCycles);
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
        for (const node in relations.dependencies) {
            if (Object.prototype.hasOwnProperty.call(relations.dependers, node)) {
                dfsVisit(node, []);
            }
        }
        return result;
    }

    public static createLayers(relations: ImmediateRelationships, cycles: CycleStore): Layers {
        let layers: LayersBuilder = new LayersBuilder();
        if (Object.keys(relations.dependencies).length === 0) {
            // TODO: Shouldnt this place everybody in the same layer?
            return layers.getLayers();
        }

        let layerWasEmpty = false;

        while (!layerWasEmpty) {
            for (const node in relations.dependers) {
                if (layers.isInPrevLayer(node)) {
                    continue;
                }
                if (Object.prototype.hasOwnProperty.call(relations.dependers, node)) {
                    // Place node on layer when parents are either not in cycle or already placed
                    const parents: Array<NodeId> = relations.dependers[node];
                    const nodeCycles: NodeCycles = cycles.getNodeCycles(node);
                    const cycleParents = new Set(nodeCycles.getParentsInCycles());
                    const nonCycleParents = parents.filter((parent) => !cycleParents.has(parent));
                    const parentsNeededInCycle = new Set(nodeCycles.getParentsNeededInCycles());
                    const relevantParents = [...nonCycleParents, ...parentsNeededInCycle];
                    const everyParentPlaced = relevantParents.every((parent) => layers.isInPrevLayer(parent));
                    if (everyParentPlaced) {
                        layers.addToLayer(node);
                    }
                }
            }
            layerWasEmpty = layers.isCurrentLayerEmpty();
            layers.finishLayer();
        }
        return layers.getLayers();
    }
}

interface ImmediateRelationships {
    dependencies: { [parent: NodeId]: Array<NodeId> };
    dependers: { [child: NodeId]: Array<NodeId> };
}
type NodeId = string;
type Layer = Array<NodeId>;
type Layers = Array<Layer>;

class CycleStore {
    private cycles: CycleRelationships = {};

    public setNodeCycles(nodeCycles: NodeCycles) {
        this.cycles[nodeCycles.node] = nodeCycles;
    }

    public getNodeCycles(node: NodeId) {
        let nodeCycles = this.cycles[node];
        if (nodeCycles == null) {
            return new NodeCycles(node);
        }
        return nodeCycles;
    }
}

type CycleRelationships = { [node: NodeId]: NodeCycles };

class NodeCycles {
    public paths: Array<Cycle> = [];
    public nodes: Set<NodeId> = new Set();

    constructor(readonly node: NodeId) {}

    /** Gives back nodes that are needed to be placed before this node, and they are in a common cycle.
     * Nodes in cycles are placed in the order they were discovered. Return the immediate discovered parent.
     * This gives an intuitive way to order nodes in a cycle.
     */
    public getParentsNeededInCycles(this: NodeCycles): Array<NodeId> {
        let parents: Array<NodeId> = [];
        for (const cycle of this.paths) {
            const index = cycle.indexOf(this.node);
            assert(index > -1, `Node is missing from a cycles it was assigned! ${this.node} <- ${cycle}`);
            if (index - 1 >= 0) {
                parents.push(cycle[index - 1]);
            }
        }
        return parents;
    }

    public getParentsInCycles(this: NodeCycles): Array<NodeId> {
        // TODO: This could be optimized to computed together with getParentsNeededInCycles.
        // These can be computed once, when nodeCycles are finished gathering.
        let parents: Array<NodeId> = [];
        for (const cycle of this.paths) {
            const index = cycle.indexOf(this.node);
            assert(index > -1, `Node is missing from a cycles it was assigned! ${this.node} <- ${cycle}`);
            if (index - 1 >= 0) {
                parents.push(cycle[index - 1]);
            } else {
                parents.push(cycle[cycle.length - 1]);
            }
        }
        return parents;
    }
}

type Cycle = Array<NodeId>;

class LayersBuilder {
    private layers: Array<Layer> = [];
    private nodesInPrevLayers: Array<NodeId> = [];
    private nodesInCurrentLayer: Array<NodeId> = [];
    private layerToBuild = 0;

    public getLayers() {
        return this.layers;
    }

    public isInPrevLayer(node: NodeId): boolean {
        return this.nodesInPrevLayers.includes(node);
    }

    public isInCurrentLayer(node: NodeId): boolean {
        return this.nodesInCurrentLayer.includes(node);
    }

    public isInAnyLayer(node: NodeId): boolean {
        return this.isInPrevLayer(node) || this.isInCurrentLayer(node);
    }

    public addToLayer(node: NodeId) {
        if (this.layers[this.layerToBuild] == null) {
            this.layers[this.layerToBuild] = [];
        }
        this.layers[this.layerToBuild].push(node);
        this.nodesInCurrentLayer.push(node);
    }

    public isCurrentLayerEmpty() {
        return this.nodesInCurrentLayer.length === 0;
    }

    /** Updates node-layer association cache, advances to next layer to build*/
    public finishLayer() {
        this.nodesInPrevLayers.push(...this.nodesInCurrentLayer);
        this.nodesInCurrentLayer = [];
        this.layerToBuild += 1;
    }
}
