import { Coord } from "../utils";
import { SvgGroup } from "./SvgGroup";
import { SvgVisualElement } from "./SvgVisualElement";

export class SvgRoot {
    private rootElem: SVGSVGElement;
    private viewportElem: SvgGroup;
    private zoomAmount: number = 1;

    private mouseMovementHandlers: Map<string, (ev: MouseEvent) => any> = new Map();

    constructor(element: SVGSVGElement) {
        this.rootElem = element;
        this.viewportElem = new SvgGroup();
        this.rootElem.appendChild(this.viewportElem.getDomElem());
        this.rootElem.onmousemove = this.createMouseMovementHandler(this);
    }

    public appendChild(elem: SvgVisualElement) {
        this.viewportElem.appendChild(elem);
    }

    public removeChild(elem: SvgVisualElement) {
        this.viewportElem.removeChild(elem);
    }

    public getDomElem() {
        return this.rootElem;
    }

    public zoom(value: number, origin: Coord) {
        this.zoomAmount += value;

        let scale = this.rootElem.createSVGTransform();
        scale.setScale(this.zoomAmount, this.zoomAmount);

        let center = this.rootElem.createSVGTransform();
        center.setTranslate(origin.x, origin.y);

        let centerOut = this.rootElem.createSVGTransform();
        centerOut.setTranslate(-origin.x, -origin.y);

        this.viewportElem.clearTransforms();
        this.viewportElem.transform(center);
        this.viewportElem.transform(scale);
        this.viewportElem.transform(centerOut);
    }

    public getViewportScale(): number {
        return 1 / this.zoomAmount;
    }

    public addMouseMovementHandler(key: string, handler: (ev: MouseEvent) => any) {
        this.mouseMovementHandlers.set(key, handler);
    }

    private createMouseMovementHandler(self: SvgRoot) {
        return (e: MouseEvent) => {
            for (const [key, handler] of self.mouseMovementHandlers) {
                handler(e);
            }
        };
    }
}
