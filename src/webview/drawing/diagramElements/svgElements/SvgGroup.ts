import { SvgVisualElement } from "./SvgVisualElement";

export class SvgGroup extends SvgVisualElement {
    private gElem: SVGGElement;
    private pos = { x: 0, y: 0 };

    constructor() {
        super("g");
        this.gElem = this.domElem as SVGGElement;
    }

    public appendChild(child: SvgVisualElement): void {
        this.gElem.appendChild(child.getDomElem());
    }

    public removeChild(child: SvgVisualElement): void {
        this.gElem.removeChild(child.getDomElem());
    }

    get children(): Array<Element> {
        return Array.from(this.gElem.children);
    }

    public clearTransforms(): void {
        this.gElem.transform.baseVal.clear();
    }

    public transform(transformation: SVGTransform): void {
        this.gElem.transform.baseVal.appendItem(transformation);
        // if (this.gElem.transform.baseVal.numberOfItems === 0) {
        //     this.gElem.transform.baseVal.appendItem(transformation);
        //     return;
        // }
        // let tr = this.gElem.transform.baseVal.getItem(0);
        // if (tr.type === transformation.type) {
        //     this.gElem.transform.baseVal.replaceItem(transformation, 0);
        // }
    }

    set posX(value: number) {
        this.pos.x = value;
        this.updatePos();
    }

    get posX(): number {
        return this.pos.x;
    }

    set posY(value: number) {
        this.pos.y = value;
        this.updatePos();
    }

    get posY(): number {
        return this.pos.y;
    }

    private updatePos() {
        this.setAttribute("transform", `translate(${this.pos.x},${this.pos.y})`);
    }
}
