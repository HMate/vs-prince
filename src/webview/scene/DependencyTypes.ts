export enum PackageType {
    UNKNOWN = "Unknown",
    LOCAL = "Local",
    SITE = "Site",
    STANDARD_LIB = "StandardLib",
}

export interface PackageDescriptor {
    type: string;
    modules: Array<string>;
}

export interface DependencyGraphDescriptor {
    nodes: Array<string>;
    edges: { [name: string]: Array<string> };
    packages: { [name: string]: PackageDescriptor };
}
