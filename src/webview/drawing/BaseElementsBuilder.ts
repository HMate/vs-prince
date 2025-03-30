import { addCoord, Coord, mulCoord, negate, Point } from "@ww/utils";
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

    public drawLineSegment(start: Coord, end: Coord, markOffset: Coord, color: string, label: string): void {
        this.createLine(start, end, color);
        this.createLine(addCoord(end, markOffset), addCoord(end, negate(markOffset)), color);
        this.createText(label, addCoord(end, mulCoord(markOffset, 3)));
    }
}
