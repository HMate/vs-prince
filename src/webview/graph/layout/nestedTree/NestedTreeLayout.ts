import { Graph, GraphNode, GraphEdge, NodeId } from "@ww/graph/Graph";
import { OrganizationEngine, OrganizationalLayers } from "@ww/graph/layout/cyclicTree/OrganizationEngine";

export type GraphId = string;
export type GraphDictionary = { [id: GraphId]: Graph };

export class NestedGraph extends Graph {
    protected subGraphs: GraphDictionary = {};

    public get graphs(): GraphDictionary {
        return this.subGraphs;
    }

    public addNodeToGroup(node: GraphNode, graphId: GraphId): void {
        super.addNode(node);
        if (this.subGraphs[graphId] == null) {
            this.subGraphs[graphId] = new Graph();
        }
        this.subGraphs[graphId].addNode(node);
    }

    public getGroupId(nid: NodeId): GraphId | undefined {
        for (const graphId in this.subGraphs) {
            if (Object.prototype.hasOwnProperty.call(this.subGraphs, graphId)) {
                const graph = this.subGraphs[graphId];
                if (graph.node(nid) != null) {
                    return graphId;
                }
            }
        }
        return undefined;
    }

    public addEdge(edge: GraphEdge): void {
        super.addEdge(edge);
    }
}

export class NestedTreeLayout {
    public arrange(_graph: Graph): void {
        throw new Error("Not Implemented");
    }

    public static assignSubGraphGroups(graph: Graph): NestedGraph {
        /* Finding groups. This algorithm aims to extract node groups automatically from a cyclic graph based on cycles.
        Algo to determine group: 
        BFS on nodes:
        - If a node has a single parent, they are in the same group.
        - If a node has multiple parents that are in the same group, the node is in the group too.
        - If a node has multiple parents, and there are any within different groups, then the node is in a 3rd group.
        Create subgroups? - If two nodes depend on each other, they could be moved to the same group, but in different subgroups?
        - Queue nodes for next BFS candidate until all their parents have a group.
        - If there is no such node, select one that we already seen. They are automatically asigned to a new group        

        Layout:
        Inside groups layout nodes as in layoutCyclicTree.
        
        Edge concretization:
        Inside groups edges are straight, or splines to avoid nodes.
        Between groups, edges from same source group are fitted together and run in parallel to target group.
         */
        const result: NestedGraph = new NestedGraph();

        const dependencies = OrganizationEngine.gatherImmediateNeighbours(graph);
        const cycles = OrganizationEngine.gatherCycles(dependencies);
        const layers: OrganizationalLayers = OrganizationEngine.createLayers(dependencies, cycles);

        let latestGroup = 0;
        for (const nodeId of layers[0]) {
            const node = graph.node(nodeId);
            if (node == null) {
                throw new Error(`Node ${nodeId} not found in graph`);
            }
            // TODO: there should be one node here on the first layer for dependency graphs,
            // but technically its possible to have more. Those may be in different groups. Handle that case if neecessary.
            result.addNodeToGroup(node, `${latestGroup}`);
        }
        latestGroup += 1;

        for (let i = 1; i < layers.length; i++) {
            const layer = layers[i];
            for (const nodeId of layer) {
                const node = graph.node(nodeId);
                if (node == null) {
                    throw new Error(`Node ${nodeId} not found in graph`);
                }
                const parents: Array<NodeId> = dependencies.parents.get(nodeId) ?? [];
                let candidateGroup = null;
                for (const parent of parents) {
                    const groupId = result.getGroupId(parent);
                    if (groupId == null) {
                        candidateGroup = latestGroup;
                        latestGroup += 1;
                        // Experiment: So we could say that based on parents that dont have a group:
                        // - This node gets a new group automatically
                        // - Assign temp group to parents, bcos nodes with same parent groups go to same group
                        //    - But how to assign temp groups? Later we may reveal that different temprgroups will be the same,
                        //      and then we have to recalc a lot of things...
                        break;
                    } else if (candidateGroup == null) {
                        candidateGroup = groupId;
                    } else if (candidateGroup !== groupId) {
                        candidateGroup = latestGroup;
                        latestGroup += 1;
                        break;
                    }
                }
                if (candidateGroup == null) {
                    candidateGroup = latestGroup;
                    latestGroup += 1;
                }
                result.addNodeToGroup(node, `${candidateGroup}`);
            }
        }

        return result;
    }
}
