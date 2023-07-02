import { Path, Marker } from "@svgdotjs/svg.js";
import { Coord, addCoord, asString, direction, mulCoord, negate } from "../utils";
import { BaseVisualizationBuilder } from "../BaseVisualizationBuilder";
import { Box } from "./Box";

export class Edge {
    private path: Path;
    private head: Marker | undefined;
    static readonly headLength = 6;
    static readonly headWidth = 8;
    constructor(
        private readonly builder: BaseVisualizationBuilder,
        private start: Box,
        private end: Box,
        private controlPoints: Coord[] = [],
        private startPoint?: Coord,
        private endPoint?: Coord
    ) {
        this.registerDef();
        this.path = this.builder.root.path();

        // if startPoint is given, it is in scene coords. We convert these to offset coords from the boxes,
        // so we when the box moves we can move the edge too.
        if (this.startPoint !== undefined) {
            this.startPoint = this.start.createOffsetPointFromScenePoint(this.startPoint);
        }
        if (this.endPoint !== undefined) {
            this.endPoint = this.end.createOffsetPointFromScenePoint(this.endPoint);
        }

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
        const startCoord =
            this.startPoint !== undefined
                ? this.start.getScenePointFromOffsetPoint(this.startPoint)
                : this.start.getBottomCenter();
        const endCoord =
            this.endPoint !== undefined
                ? this.end.getScenePointFromOffsetPoint(this.endPoint)
                : this.end.getTopCenter();
        const endDirection = direction(startCoord, endCoord);
        const renderEnd = addCoord(endCoord, negate(mulCoord(endDirection, Edge.headLength + 4)));
        const pathString = this.computePathString(startCoord, renderEnd, this.controlPoints);
        this.path.plot(pathString);
        this.path.attr({ fill: "none" });
        this.path.addClass("pyprince-simple-edge");
        if (this.head != null) {
            this.path.marker("end", this.head);
        }
        return this;
    }

    private computePathString(startCoord: Coord, endCoord: Coord, cps: Coord[]): string {
        const upDirection: Coord = { x: 0, y: -1 };
        let pathString = `M ${asString(startCoord)}`;
        for (const cp of cps) {
            pathString += ` L ${asString(cp)}`;
        }
        pathString += ` S ${asString(addCoord(endCoord, upDirection))} ${asString(endCoord)}`;
        return pathString;
    }

    private addMovementHandlers() {
        const cb = (_event: MouseEvent) => {
            this.update();
        };
        this.start.getRoot().on("dragmove.namespace", cb);
        this.end.getRoot().on("dragmove.namespace", cb);
    }
}
