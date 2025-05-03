import { DependencyGraphDescriptor } from "@ww/scene/DependencyTypes";

export interface BaseMessage {
    command: string;
}

export interface DrawDependenciesMessage extends BaseMessage {
    command: "draw-dependencies";
    data: DependencyGraphDescriptor;
}

export interface ShowLoadingMessage extends BaseMessage {
    command: "show-loading";
}
