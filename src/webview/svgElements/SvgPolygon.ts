import { Point } from "../utils";
import { SvgVisualElement } from "./SvgVisualElement";

export class SvgPolygon extends SvgVisualElement {
    private classElem: SVGPolygonElement;

    constructor(readonly originalPoints: Array<Point>) {
        super("polygon");
        this.classElem = this.domElem as SVGPolygonElement;
        this.setPolygonPoints(this.originalPoints);
    }

    get points(): Array<Point> {
        let result: Array<Point> = [];
        for (let i = 0; i < this.classElem.points.numberOfItems; i++) {
            let p = this.classElem.points.getItem(i);
            result.push([p.x, p.y]);
        }
        return result;
    }

    set posX(value: number) {
        let points: Array<Point> = this.originalPoints.map((p) => [p[0] + value, p[1]]);
        this.setPolygonPoints(points);
    }

    set posY(value: number) {
        let points: Array<Point> = this.originalPoints.map((p) => [p[0], p[1] + value]);
        this.setPolygonPoints(points);
    }

    private setPolygonPoints(points: Array<Point>) {
        this.setAttribute("points", points.map((p) => `${p[0]},${p[1]}`).join(" "));
    }
}
