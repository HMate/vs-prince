export type SvgInHtml = HTMLElement & SVGSVGElement;

/** Creates list with range of numbers. */
export function range(to: number): Array<number>;
export function range(from: number, to: number): Array<number>;
export function range(from: number, to?: number): Array<number> {
    if (to == null) {
        return [...Array(from).keys()];
    }
    let size = to - from;
    let sign = 1;
    if (size < 0) {
        sign = -1;
        size = -size;
    }
    return [...Array(size).keys()].map((val) => from + sign * val);
}

export type Coord = { x: number; y: number };
export type Point = [number, number];

export function coord(x: number, y: number): Coord {
    return { x: x, y: y };
}

export function addPoint(p0: Point, p1: Point): Point {
    return [p0[0] + p1[0], p0[1] + p1[1]];
}

// TODO: start using a vector library..ie @thi.ng/vectors, or evanshortiss/vector2d
export function asString(coord: Coord): string {
    return `${coord.x},${coord.y}`;
}

export function negate(coords: Coord): Coord {
    return { x: -coords.x, y: -coords.y };
}

export function mulCoord(start: Coord, multiplier: number): Coord {
    return { x: multiplier * start.x, y: multiplier * start.y };
}

export function addCoord(start: Coord, end: Coord): Coord {
    return { x: end.x + start.x, y: end.y + start.y };
}

export function diffCoord(start: Coord, end: Coord): Coord {
    return { x: end.x - start.x, y: end.y - start.y };
}

export function interpCoord(start: Coord, end: Coord, t: number): Coord {
    return { x: start.x + t * (end.x - start.x), y: start.y + t * (end.y - start.y) };
}

export function direction(start: Coord, end: Coord): Coord {
    const d = diffCoord(start, end);
    const magn = Math.sqrt(d.x * d.x + d.y * d.y);
    return { x: d.x / magn, y: d.y / magn };
}

export enum MouseButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2,
    SIDE_BACK = 3,
    SIDE_FORWARD = 4,
}

export const enum MouseButtons {
    LEFT = 1,
    MIDDLE = 2,
    RIGHT = 4,
    SIDE_BACK = 8,
    SIDE_FORWARD = 16,
}
