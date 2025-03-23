import { Coord, interpCoord } from "@ww/utils";

export class BSpline {
    constructor(readonly controlPoints: Coord[] = []) {}

    /** Calculate the control points of a cubic (degree 3) bezier spline,
     * whose first and last control points lie on the curve itself */
    public calculateCubicBezierPoints(): Coord[] {
        // source math: http://web.archive.org/web/20120227050519/http://tom.cs.byu.edu/~455/bs.pdf
        const result: Coord[] = [];

        const cpLast = this.controlPoints.length - 1;
        const polarPoints = [this.controlPoints[0], this.controlPoints[0]]
            .concat(this.controlPoints)
            .concat([this.controlPoints[cpLast], this.controlPoints[cpLast]]);
        const endPointCount = polarPoints.length - 2;
        const t = 1 / 3;
        const half = 0.5;
        for (let i = 0; i < endPointCount; i++) {
            const p0 = polarPoints[i];
            const p1 = polarPoints[i + 1];
            const p2 = polarPoints[i + 2];

            const sub0 = interpCoord(p1, p0, t);
            const sub1 = interpCoord(p1, p2, t);

            const endPoint = interpCoord(sub0, sub1, half);

            if (i === 0) {
                result.push(endPoint);
                result.push(sub1);
            } else if (i === endPointCount - 1) {
                result.push(sub0);
                result.push(endPoint);
            } else {
                result.push(sub0);
                result.push(endPoint);
                result.push(sub1);
            }
        }
        return result;
    }
}
