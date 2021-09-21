import { SvgVisualElement } from "./SvgVisualElement";

export class SvgCircle extends SvgVisualElement {
    private classElem: SVGCircleElement;

    constructor() {
        super("circle");
        this.classElem = this.domElem as SVGCircleElement;
    }

    set radius(value: number) {
        this.classElem.setAttribute("r", value.toString());
    }

    get radius(): number {
        return this.classElem.r.baseVal.value;
    }

    set posX(value: number) {
        this.setAttribute("cx", value);
    }

    set posY(value: number) {
        this.setAttribute("cy", value);
    }
}
