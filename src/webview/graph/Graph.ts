export type NodeId = string;

export type EdgeId = string;
export function toEdgeId(start: NodeId, end: NodeId) {
    return start + "@e@" + end;
}

export interface GraphNode {
    name: NodeId;
    width: number;
    height: number;
}

export interface GraphEdge {
    start: NodeId;
    end: NodeId;
}

/** A simple graph structure, that holds nodes and edges */
export class Graph {
    private nodeList: Array<GraphNode> = [];
    private edgeList: Array<GraphEdge> = [];

    public addNode(node: GraphNode) {
        this.nodeList.push(node);
    }

    public addEdge(edge: GraphEdge) {
        this.edgeList.push(edge);
    }

    public node(nid: NodeId): GraphNode | undefined {
        return this.nodes.find((elem: GraphNode) => elem.name === nid);
    }

    public edge(start: NodeId, end: NodeId): GraphEdge | undefined {
        return this.edges.find((elem: GraphEdge) => elem.start === start && elem.end === end);
    }

    public get nodes(): Array<GraphNode> {
        return this.nodeList;
    }

    public get edges(): Array<GraphEdge> {
        return this.edgeList;
    }
}

/** A concrete graph differs from a simple Graph in that nodes and edges have concrete position data */
export class ConcreteGraph {
    private nodePositions: Map<NodeId, ConcreteGraphNodePosition> = new Map();
    private edgePositions: Map<EdgeId, ConcreteGraphEdgePosition> = new Map();

    public addNode(node: ConcreteGraphNodePosition) {
        this.nodePositions.set(node.name, node);
    }

    public addEdge(edge: ConcreteGraphEdgePosition) {
        this.edgePositions.set(toEdgeId(edge.start, edge.end), edge);
    }

    public nodePos(nid: NodeId): ConcreteGraphNodePosition | undefined {
        return this.nodePositions.get(nid);
    }

    public edgePos(eid: EdgeId): ConcreteGraphEdgePosition | undefined {
        return this.edgePositions.get(eid);
    }

    public nodes(): Array<NodeId> {
        return Array.from(this.nodePositions.keys());
    }

    public edges(): Array<EdgeId> {
        return Array.from(this.edgePositions.keys());
    }
}

export interface ConcreteGraphNodePosition {
    name: NodeId;
    cx: number; // Center X pos of node
    cy: number; // Center Y pos of node
}

export interface ConcreteGraphEdgePosition {
    start: NodeId;
    end: NodeId;
}
