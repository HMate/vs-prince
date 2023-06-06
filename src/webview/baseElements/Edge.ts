import { Path, Marker } from "@svgdotjs/svg.js";
import { addCoord, asString, direction, mulCoord, negate } from "../utils";
import { BaseVisualizationBuilder } from "../BaseVisualizationBuilder";
import { Box } from "./Box";

export class Edge {
    private path: Path;
    private head: Marker | undefined;
    static readonly headLength = 6;
    static readonly headWidth = 8;
    constructor(private readonly builder: BaseVisualizationBuilder, private start: Box, private end: Box) {
        this.registerDef();
        this.path = this.builder.root.path();
        this.render().update();
        this.addMovementHandlers();
    }

    public getPath(): Path {
        return this.path;
    }

    private registerDef() {
        this.head = this.builder.registerDef("simpleEdge", Edge.headLength, Edge.headWidth, function (head) {
            head.polygon(`0,0 ${Edge.headLength},${Edge.headWidth / 2} 0,${Edge.headWidth}`);
        });
    }

    private render() {
        this.path.addClass("pyprince-simple-edge");
        if (this.head != null) {
            this.path.marker("end", this.head);
        }
        return this;
    }

    public update(): this {
        const startCoord = this.start.getBottomCenter();
        const endCoord = this.end.getTopCenter();
        const endDirection = direction(startCoord, endCoord);
        const renderEnd = addCoord(endCoord, negate(mulCoord(endDirection, Edge.headLength + 4)));
        this.path.plot(`M ${asString(startCoord)} L ${asString(renderEnd)}`);
        this.path.addClass("pyprince-simple-edge");
        if (this.head != null) {
            this.path.marker("end", this.head);
        }
        return this;
    }

    private addMovementHandlers() {
        const cb = (_event: MouseEvent) => {
            this.update();
        };
        this.start.getRoot().on("dragmove.namespace", cb);
        this.end.getRoot().on("dragmove.namespace", cb);
    }
}
