import { Container, Rect, Text } from "@svgdotjs/svg.js";

import { BaseVisualizationBuilder } from "../BaseVisualizationBuilder";
import TextToSVG from "../TextToSvg";

export interface BoxDescription {
    name: string;
    width?: number;
    height?: number;
    boxStyle?: Partial<CSSStyleDeclaration>;
    textStyle?: Partial<CSSStyleDeclaration>; // Uses text attributes, and not css props
}

// A box is a rectanble shape with a name label
export class Box {
    static readonly defaultMinWidth = 200;
    static readonly defaultTextMarginWidth = 10;
    static readonly defaultHeight = 60;
    static readonly nameMarginTop = 20;

    private desc: BoxDescription;
    private root: Container;
    private shapeHolder: Rect;
    private nameHolder: Text;

    constructor(
        private readonly builder: BaseVisualizationBuilder,
        private tts: TextToSVG,
        description?: BoxDescription
    ) {
        this.desc = description ?? { name: "" };
        if (description?.width) {
            this.desc.width = description?.width;
        } else {
            // TODO: Dontsize here ios the same as in webview-style.scss prince-box-name.
            let calcWidth = this.tts.getWidth(this.desc.name, { fontSize: 22 }) + 2 * Box.defaultTextMarginWidth;
            this.desc.width = Math.max(calcWidth, Box.defaultMinWidth);
        }
        this.desc.height = description?.height ?? Box.defaultHeight;
        this.desc.boxStyle = description?.boxStyle;
        this.desc.textStyle = description?.textStyle;

        this.root = this.builder.createGroup();
        this.shapeHolder = this.builder.createRect();
        this.nameHolder = this.builder.createText(this.desc.name);
        this.render().update();
    }

    private render() {
        this.shapeHolder.width(this.desc.width!);
        this.shapeHolder.height(this.desc.height!);
        this.shapeHolder.radius(15);
        if (this.desc.boxStyle) {
            this.shapeHolder.css(this.desc.boxStyle);
        }
        this.shapeHolder.addClass("prince-box");

        this.nameHolder.addClass("prince-box-name");
        if (this.desc.textStyle) {
            // TODO Setting font properties do nothing, come up with soluton to set them dinamically, and not from stylesheet file
            this.nameHolder.css(this.desc.textStyle);
        }

        this.builder.addChildToRoot(this.root);
        this.root.add(this.shapeHolder);
        this.root.add(this.nameHolder);

        this.addMovementHandlers(this.root);
        return this;
    }

    public update() {
        this.nameHolder.text(this.desc.name);
        this.nameHolder.center(Number(this.shapeHolder.width()) / 2, Number(this.shapeHolder.height()) / 2);
        return this;
    }

    public width(): number {
        return Number(this.shapeHolder.width());
    }

    public height(): number {
        return Number(this.shapeHolder.height());
    }

    public move(cx: number, cy: number) {
        this.root.cx(cx);
        this.root.cy(cy);
    }

    private addMovementHandlers(group: Container) {
        group.draggable();
    }
}
