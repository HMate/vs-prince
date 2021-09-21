import { SvgVisualElement } from "./SvgVisualElement";

export class SvgText extends SvgVisualElement {
    private textElem: SVGTextElement;

    constructor() {
        super("text");
        this.textElem = this.domElem as SVGTextElement;
    }

    public text(text: string) {
        this.domElem.textContent = text;
    }
}
