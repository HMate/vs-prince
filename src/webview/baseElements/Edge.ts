import { Path, Marker } from "@svgdotjs/svg.js";
import { addCoord, asString, Coord, direction, mulCoord, negate } from "../utils";
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

    public getPath() {
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

    public update() {
        let startCoord = this.start.getBottomCenter();
        let endCoord = this.end.getTopCenter();
        let endDirection = direction(startCoord, endCoord);
        let renderEnd = addCoord(endCoord, negate(mulCoord(endDirection, Edge.headLength + 4)));
        this.path.plot(`M ${asString(startCoord)} L ${asString(renderEnd)}`);
        this.path.addClass("pyprince-simple-edge");
        if (this.head != null) {
            this.path.marker("end", this.head);
        }
        return this;
    }

    private addMovementHandlers() {
        let cb = (_event: MouseEvent) => {
            this.update();
        };
        this.start.getRoot().on("dragmove.namespace", cb);
        this.end.getRoot().on("dragmove.namespace", cb);
    }
}
