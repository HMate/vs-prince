import { DependencyGraphDescriptor, PackageDescriptor, PackageType } from "@ww/scene/DependencyTypes";

export class DependencyModelManager {
    public showShallowStandardLibrary(descriptor: DependencyGraphDescriptor): DependencyGraphDescriptor {
        const builder = new DependencySceneBuilder();

        for (const packageName in descriptor.packages) {
            const pack = descriptor.packages[packageName];
            if (pack.type !== PackageType.STANDARD_LIB) {
                builder.addPackage(packageName, pack);
            } else {
                builder.createPackage(packageName, PackageType.STANDARD_LIB);
            }
        }

        for (const module of descriptor.nodes) {
            if (builder.containsPackageOfModule(module)) {
                builder.addModule(module);
            }
        }

        for (const edgeStart in descriptor.edges) {
            if (!builder.containsModule(edgeStart)) {
                continue;
            }
            const edgeTargets = descriptor.edges[edgeStart];
            for (const target of edgeTargets) {
                if (builder.containsModule(target)) {
                    builder.addEdge(edgeStart, target);
                }
            }
        }

        return builder.build();
    }

    public hideStandardLibrary(descriptor: DependencyGraphDescriptor): DependencyGraphDescriptor {
        const builder = new DependencySceneBuilder();

        for (const packageName in descriptor.packages) {
            const pack = descriptor.packages[packageName];
            if (pack.type !== PackageType.STANDARD_LIB) {
                builder.addPackage(packageName, pack);
            } else {
                builder.createPackage(packageName, PackageType.STANDARD_LIB);
            }
        }

        for (const module of descriptor.nodes) {
            if (builder.containsPackageOfModule(module)) {
                builder.addModule(module);
            }
        }

        for (const edgeStart in descriptor.edges) {
            if (!builder.containsModule(edgeStart)) {
                continue;
            }
            const edgeTargets = descriptor.edges[edgeStart];
            for (const target of edgeTargets) {
                if (builder.containsModule(target)) {
                    builder.addEdge(edgeStart, target);
                }
            }
        }

        return builder.build();
    }
}

export class DependencySceneBuilder {
    private descriptor = { nodes: [], edges: {}, packages: {} } as DependencyGraphDescriptor;

    public build(): DependencyGraphDescriptor {
        return this.descriptor;
    }

    public addModule(module: string): void {
        this.descriptor.nodes.push(module);
    }

    public addEdge(start: string, end: string): void {
        if (Object.prototype.hasOwnProperty.call(this.descriptor.edges, start)) {
            this.descriptor.edges[start].push(end);
        } else {
            this.descriptor.edges[start] = [end];
        }
    }

    public addPackage(packageName: string, pack: PackageDescriptor): void {
        this.descriptor.packages[packageName] = pack;
    }

    public createPackage(packageName: string, packageType: PackageType): void {
        const pack = { type: packageType, modules: [] } as PackageDescriptor;
        this.addPackage(packageName, pack);
    }

    public containsPackageOfModule(module: string): boolean {
        const parents = Object.values(this.descriptor.packages).filter((pack: PackageDescriptor) =>
            pack.modules.includes(module)
        );
        return parents.length > 0;
    }

    public containsModule(module: string): boolean {
        return this.descriptor.nodes.includes(module);
    }
}
