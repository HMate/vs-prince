export interface BaseMessage {
    command: string;
}

export interface DependencyGraphDescriptor {
    nodes: Array<string>;
    edges: { [name: string]: Array<string> };
    packages: { [name: string]: Array<string> };
}

export interface DrawDependenciesMessage extends BaseMessage {
    command: "draw-dependencies";
    data: DependencyGraphDescriptor;
}

export interface ShowLoadingMessage extends BaseMessage {
    command: "show-loading";
}
