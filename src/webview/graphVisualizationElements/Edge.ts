import { Path, Marker } from "@svgdotjs/svg.js";
import { Coord, asString } from "../utils";
import { GraphVisualizationBuilder } from "../GraphVisualizationBuilder";
import { Box } from "./Box";
import { NodeId } from "../graph/Graph";
import { BSpline } from "../spline/BSpline";

export interface EdgeDescription {
    start: NodeId;
    end: NodeId;
    isBSpline: boolean;
    controlPoints: Coord[];
    startPoint?: Coord;
    endPoint?: Coord;
}

export class Edge {
    private path: Path;
    private head: Marker | undefined;
    private desc: EdgeDescription;
    static readonly headLength = 3;
    static readonly headWidth = 4;
    constructor(
        private readonly builder: GraphVisualizationBuilder,
        private start: Box,
        private end: Box,
        private controlPoints: Coord[] = [],
        private startPoint?: Coord,
        private endPoint?: Coord,
        private readonly isBSpline?: boolean
    ) {
        this.path = this.builder.root.path();

        // if startPoint is given, it is in scene coords. We convert these to offset coords from the boxes,
        // so we when the box moves we can move the edge too.
        if (this.startPoint !== undefined) {
            this.startPoint = this.start.SceneCoordToLocalCoord(this.startPoint);
        }
        if (this.endPoint !== undefined) {
            this.endPoint = this.end.SceneCoordToLocalCoord(this.endPoint);
        }

        this.desc = {
            start: this.start.name(),
            end: this.end.name(),
            isBSpline: !!this.isBSpline,
            controlPoints: this.controlPoints,
            startPoint: this.startPoint,
            endPoint: this.endPoint,
        };

        this.render().update();
        this.addMovementHandlers();
    }

    public getPath(): Path {
        return this.path;
    }

    public serialize(): EdgeDescription {
        const result = {
            ...this.desc,
            startPoint: this.startPoint !== undefined ? this.start.LocalCoordToSceneCoord(this.startPoint) : undefined,
            endPoint: this.endPoint !== undefined ? this.end.LocalCoordToSceneCoord(this.endPoint) : undefined,
        };
        return result;
    }

    private registerArrowDef() {
        this.head = this.builder.registerDef("simpleEdge", Edge.headLength, Edge.headWidth, "auto", function (head) {
            // 0,0 is top left
            head.path(`M 0 0 L ${Edge.headLength} ${Edge.headWidth / 2} L 0 ${Edge.headWidth} z`);
        });
    }

    private render() {
        this.registerArrowDef();
        this.path.addClass("pyprince-simple-edge");
        if (this.head != null) {
            this.path.marker("end", this.head);
        }
        return this;
    }

    private update(): this {
        const startCoord =
            this.startPoint !== undefined
                ? this.start.LocalCoordToSceneCoord(this.startPoint)
                : this.start.getBottomCenter();
        const endCoord =
            this.endPoint !== undefined ? this.end.LocalCoordToSceneCoord(this.endPoint) : this.end.getTopCenter();
        let pathString: string;
        if (!this.isBSpline) {
            pathString = this.computePathString(startCoord, endCoord, this.controlPoints);
        } else {
            pathString = this.computeBSplinePath(startCoord, endCoord, this.controlPoints);
        }
        this.path.plot(pathString);
        this.path.attr({ fill: "none" });
        return this;
    }

    private computePathString(startCoord: Coord, endCoord: Coord, cps: Coord[]): string {
        let pathString = `M ${asString(startCoord)}`;
        for (const cp of cps) {
            pathString += ` L ${asString(cp)}`;
        }
        pathString += ` L ${asString(endCoord)}`;
        return pathString;
    }

    private computeBSplinePath(startCoord: Coord, endCoord: Coord, cps: Coord[]): string {
        const controlPoints = [startCoord].concat(cps).concat([endCoord]);
        const spline = new BSpline(controlPoints);
        const bezierCps = spline.calculateCubicBezierPoints();

        let path = `M ${bezierCps[0].x} ${bezierCps[0].y}`;

        for (let i = 1; i < bezierCps.length; i += 3) {
            const p1 = bezierCps[i];
            const p2 = bezierCps[i + 1];
            const p3 = bezierCps[i + 2];
            path += ` C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
        }

        return path;
    }

    private addMovementHandlers() {
        const cb = () => {
            this.update();
        };
        this.start.getRoot().on("dragmove.namespace", cb);
        this.end.getRoot().on("dragmove.namespace", cb);
    }
}
