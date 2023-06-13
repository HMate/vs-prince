import { Coord } from "../utils";
import { SvgGroup } from "./SvgGroup";
import { SvgVisualElement } from "./SvgVisualElement";

export class SvgRoot {
    private rootElem: SVGSVGElement;
    private viewportElem: SvgGroup;
    private zoomAmount = 1;

    private mouseMovementHandlers: Map<string, (ev: MouseEvent) => any> = new Map();

    constructor(element: SVGSVGElement) {
        this.rootElem = element;
        this.viewportElem = new SvgGroup();
        this.rootElem.appendChild(this.viewportElem.getDomElem());
        this.rootElem.onmousemove = this.createMouseMovementHandler(this);
    }

    public appendChild(elem: SvgVisualElement): void {
        this.viewportElem.appendChild(elem);
    }

    public removeChild(elem: SvgVisualElement): void {
        this.viewportElem.removeChild(elem);
    }

    public getDomElem(): SVGSVGElement {
        return this.rootElem;
    }

    public zoom(value: number, origin: Coord): void {
        this.zoomAmount += value;

        const scale = this.rootElem.createSVGTransform();
        scale.setScale(this.zoomAmount, this.zoomAmount);

        const center = this.rootElem.createSVGTransform();
        center.setTranslate(origin.x, origin.y);

        const centerOut = this.rootElem.createSVGTransform();
        centerOut.setTranslate(-origin.x, -origin.y);

        this.viewportElem.clearTransforms();
        this.viewportElem.transform(center);
        this.viewportElem.transform(scale);
        this.viewportElem.transform(centerOut);
    }

    public getViewportScale(): number {
        return 1 / this.zoomAmount;
    }

    public addMouseMovementHandler(key: string, handler: (ev: MouseEvent) => any): void {
        this.mouseMovementHandlers.set(key, handler);
    }

    private createMouseMovementHandler(self: SvgRoot) {
        return (e: MouseEvent) => {
            for (const [_key, handler] of self.mouseMovementHandlers) {
                handler(e);
            }
        };
    }
}
