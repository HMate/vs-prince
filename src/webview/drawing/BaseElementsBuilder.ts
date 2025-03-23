import { Coord, Point } from "@ww/utils";
import { SvgVisualizationBuilder } from "./SvgVisualizationBuilder";

export class BaseElementsBuilder {
    constructor(private readonly svgBuilder: SvgVisualizationBuilder) {}

    public createLine(start: Coord, end: Coord, color?: string): void {
        const line = this.svgBuilder.createLine([start, end]);
        color = color ?? "black";
        line.stroke(color);
    }

    public createText(textContent: string, coord: Coord): void {
        const text = this.svgBuilder.createText(textContent);
        text.center(coord.x, coord.y);
    }
}
