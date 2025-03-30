import { addCoord, Coord, coord, mulCoord, negate } from "@ww/utils";
import { DependencyGraphDescriptor } from "@ww/extensionMessages";
import { WebviewStateHandler } from "@ww/WebviewStateHandler";
import { GraphVizDiagramBuilder } from "./GraphvizDiagramBuilder";
import { drawDependenciesElk } from "./ElkjsDiagramBuilder";
import { drawDependenciesCustom } from "./CustomDiagramBuilder";
import { GraphVisualizationBuilder } from "./GraphVisualizationBuilder";
import { BaseElementsBuilder } from "./BaseElementsBuilder";

export async function drawDependencies(
    viewState: WebviewStateHandler,
    baseBuilder: GraphVisualizationBuilder,
    descriptor: DependencyGraphDescriptor
): Promise<void> {
    drawDebugScene(baseBuilder);
    await new GraphVizDiagramBuilder(viewState, baseBuilder).createDiagram(descriptor);
    drawDebugScene(baseBuilder);
}

function drawDebugScene(svgBuilder: GraphVisualizationBuilder) {
    const baseBuilder = new BaseElementsBuilder(svgBuilder);
    const cyan = "#00CC99";
    const purple = "#7722CC";

    baseBuilder.createText("X", coord(100, -7));
    for (let index = 0; index < 10; index++) {
        const start = index * 100;
        const end = (index + 1) * 100;
        baseBuilder.drawLineSegment(coord(start, 0), coord(end, 0), coord(0, 4), cyan, end.toString());
    }
    baseBuilder.createText("Y", coord(-5, 100));
    for (let index = 0; index < 10; index++) {
        const start = index * 100;
        const end = (index + 1) * 100;
        baseBuilder.drawLineSegment(coord(0, start), coord(0, end), coord(6, 0), purple, end.toString());
    }
}
