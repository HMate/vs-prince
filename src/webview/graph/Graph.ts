export interface GraphNode {
    name: string;
    width: number;
    height: number;
}

export interface GraphEdge {
    start: string;
    end: string;
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

    public get nodes(): Array<GraphNode> {
        return this.nodeList;
    }

    public get edges(): Array<GraphEdge> {
        return this.edgeList;
    }
}
