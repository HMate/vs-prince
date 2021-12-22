export interface BaseMessage {
    command: string;
}

export interface DependencyGraph {
    nodes: Array<string>;
    edges: { [name: string]: Array<string> };
}

export interface DrawDependenciesMessage extends BaseMessage {
    command: "draw-dependencies";
    data: DependencyGraph;
}
