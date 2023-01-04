import { Graph, NodeId } from "../Graph";

export class OrganizationEngine {
    /** Logical positions calculation for cyclic tree graphs */
    public static organize(graph: Graph) {
        let dependencies = OrganizationEngine.gatherImmediateNeighbours(graph);
        let cycles = OrganizationEngine.gatherCycles(dependencies);
        return OrganizationEngine.createLayers(dependencies, cycles);
    }

    /** Make double-linked list of nodes, to easy to search for cycles, layers */
    public static gatherImmediateNeighbours(graph: Graph): ImmediateRelationships {
        let rel: ImmediateRelationships = { dependencies: new Map(), dependers: new Map() };
        for (const node of graph.nodes) {
            if (rel.dependers.has(node.name)) {
                console.warn(`Found duplicated nodeId: ${node.name}`);
                continue;
            }
            rel.dependers.set(node.name, []);
            rel.dependencies.set(node.name, []);
        }
        for (const edge of graph.edges) {
            rel.dependencies.get(edge.start)!.push(edge.end);
            rel.dependers.get(edge.end)!.push(edge.start);
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
            const dependencies = relations.dependencies.get(currentNode)!;
            for (const dep of dependencies) {
                dfsVisit(dep, Array.from(path));
            }
        }
        for (const node of relations.dependencies.keys()) {
            dfsVisit(node, []);
        }
        return result;
    }

    public static createLayers(relations: ImmediateRelationships, cycles: CycleStore): OrganizationalLayers {
        let layers: LayersBuilder = new LayersBuilder();
        if (relations.dependencies.size === 0) {
            // TODO: Shouldnt this place everybody in the same layer?
            return layers.getLayers();
        }

        let layerWasEmpty = false;

        while (!layerWasEmpty) {
            for (const node of relations.dependers.keys()) {
                if (layers.isInPrevLayer(node)) {
                    continue;
                }

                // Place node on layer when parents are either not in cycle or already placed
                const parents: Array<NodeId> = relations.dependers.get(node)!;
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
            layerWasEmpty = layers.isCurrentLayerEmpty();
            layers.finishLayer();
        }
        return layers.getLayers();
    }
}

interface ImmediateRelationships {
    dependencies: Map<NodeId, Array<NodeId>>; // nodes that key depend on
    dependers: Map<NodeId, Array<NodeId>>; // nodes that depend on key
}

export type OrganizationalLayer = Array<NodeId>;
export type OrganizationalLayers = Array<OrganizationalLayer>;

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
            if (index <= -1) {
                throw new Error(`Node is missing from a cycles it was assigned! ${this.node} <- ${cycle}`);
            }
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
            if (index <= -1) {
                throw new Error(`Node is missing from a cycles it was assigned! ${this.node} <- ${cycle}`);
            }
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
    private layers: Array<OrganizationalLayer> = [];
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
