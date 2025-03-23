import { GraphVisualizationBuilder } from "../GraphVisualizationBuilder";
import { DependencyGraphDescriptor } from "../extensionMessages";
import { WebviewStateHandler } from "../WebviewStateHandler";
import { GraphVizDiagramBuilder } from "./GraphvizDiagramBuilder";
import { drawDependenciesElk } from "./ElkjsDiagramBuilder";
import { drawDependenciesCustom } from "./CustomDiagramBuilder";

export async function drawDependencies(
    viewState: WebviewStateHandler,
    baseBuilder: GraphVisualizationBuilder,
    descriptor: DependencyGraphDescriptor
): Promise<void> {
    await new GraphVizDiagramBuilder(viewState, baseBuilder).createDiagram(descriptor);
}
