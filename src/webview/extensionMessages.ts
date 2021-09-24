export interface BaseMessage {
    command: string;
}

export interface DrawDependenciesMessage extends BaseMessage {
    command: "draw-dependencies";
    data: { nodes: Array<string>; edges: { [name: string]: Array<string> } };
}
