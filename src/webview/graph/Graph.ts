export type NodeId = string;

export interface GraphNode {
    name: NodeId;
    width: number;
    height: number;
}

export interface GraphEdge {
    start: NodeId;
    end: NodeId;
}

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
