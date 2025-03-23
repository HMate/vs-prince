import { DependencyGraphDescriptor } from "@ww/extensionMessages";
import { WebviewStateHandler } from "@ww/WebviewStateHandler";
import { GraphVizDiagramBuilder } from "./GraphvizDiagramBuilder";
import { drawDependenciesElk } from "./ElkjsDiagramBuilder";
import { drawDependenciesCustom } from "./CustomDiagramBuilder";
import { GraphVisualizationBuilder } from "./GraphVisualizationBuilder";

export async function drawDependencies(
    viewState: WebviewStateHandler,
    baseBuilder: GraphVisualizationBuilder,
    descriptor: DependencyGraphDescriptor
): Promise<void> {
    await new GraphVizDiagramBuilder(viewState, baseBuilder).createDiagram(descriptor);
}
