import { SvgInHtml } from "../utils";

export class SvgVisualElement {
    protected domElem: SVGElement;

    constructor(elem: string) {
        this.domElem = document.createElementNS("http://www.w3.org/2000/svg", elem) as SVGElement;
    }

    public getDomElem(): SVGElement {
        return this.domElem;
    }

    public addClass(className: string): SvgVisualElement {
        this.domElem.setAttribute("class", className);
        return this;
    }

    public setAttribute(name: string, value: string | number): SvgVisualElement {
        this.domElem.setAttribute(name, value.toString());
        return this;
    }

    get width(): number {
        return this.domElem.getBoundingClientRect().width;
    }

    get height(): number {
        return this.domElem.getBoundingClientRect().height;
    }

    public getNumberAttribute(name: string, defaultValue: number = 0): number {
        let value = this.domElem.getAttribute(name);
        if (value == null) {
            return defaultValue;
        }
        return parseFloat(value);
    }

    public getAttribute(name: string, defaultValue: string | undefined = undefined): string | undefined {
        let value = this.domElem.getAttribute(name);
        if (value == null) {
            return defaultValue;
        }
        return value;
    }

    set posX(value: number) {
        this.setAttribute("x", value);
    }

    set posY(value: number) {
        this.setAttribute("y", value);
    }
}
