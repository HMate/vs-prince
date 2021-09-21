import { SvgVisualElement } from "./SvgVisualElement";

export class SvgRect extends SvgVisualElement {
    private rectElem: SVGRectElement;

    constructor() {
        super("rect");
        this.rectElem = this.domElem as SVGRectElement;
    }

    get width(): number {
        return parseFloat(this.rectElem.style.width);
    }

    set width(value: number) {
        this.domElem.style.width = value.toString();
    }

    get height(): number {
        return parseFloat(this.rectElem.style.height);
    }

    set height(value: number) {
        this.domElem.style.height = value.toString();
    }
}
