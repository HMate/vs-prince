import { Container, Rect, Text } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.draggable.js";

import TextToSVG from "@ww/TextToSvg";
import { coord, Coord } from "@ww/utils";
import { GraphVisualizationBuilder } from "@ww/drawing/GraphVisualizationBuilder";

export interface BoxDescription {
    name: string;
    width?: number;
    height?: number;
    centerPosition?: Coord;
    boxStyle?: any;
    textStyle?: any; // Uses text attributes, and not css props
    textPosition?: Coord;
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

    private dragCallback?: (box: Box) => void;

    constructor(
        private readonly builder: GraphVisualizationBuilder,
        private tts: TextToSVG,
        description?: BoxDescription
    ) {
        this.desc = Object.assign({}, description ?? { name: "" });
        if (description?.width) {
            this.desc.width = description?.width;
        } else {
            // TODO: fontSize here is the same as in webview-style.scss prince-box-name.
            const calcWidth = this.tts.getWidth(this.desc.name, { fontSize: 22 }) + 2 * Box.defaultTextMarginWidth;
            this.desc.width = Math.max(calcWidth, Box.defaultMinWidth);
        }
        this.desc.height = description?.height ?? Box.defaultHeight;
        this.desc.boxStyle = description?.boxStyle;
        this.desc.textStyle = description?.textStyle;

        this.root = this.builder.createGroup();
        this.shapeHolder = this.builder.createRect();
        this.nameHolder = this.builder.createText(this.desc.name);

        this.render().update();

        // Have to call moveCenter after render+update, because they both change the size and thus affect how center is calculated
        if (description?.centerPosition) {
            this.moveCenter(description.centerPosition.x, description.centerPosition.y);
        }
        if (description?.textPosition) {
            this.desc.textPosition = description?.textPosition;
            this.moveLabelRelative(description?.textPosition.x, description?.textPosition.y);
        }
    }

    public serialize(): BoxDescription {
        return { ...this.desc };
    }

    public name(): string {
        return this.desc.name;
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

    private update(): this {
        this.nameHolder.text(this.desc.name);
        this.nameHolder.center(Number(this.shapeHolder.width()) / 2, Number(this.shapeHolder.height()) / 2);
        return this;
    }

    public getRoot(): Container {
        return this.root;
    }

    public setSize(width: number, height: number): void {
        // NOTE: Setting width/height of node can cause the label to be left outside the box.
        // In this case the center of the box will not align with the center of the shape, because svg computes the
        // center from the bounding box of the whole compnent. So we have to move the text first before the center!
        this.innerSetWidth(width);
        this.innerSetHeight(height);
        this.update();
    }

    public width(): number {
        return Number(this.shapeHolder.width());
    }

    public setWidth(w: number): void {
        this.innerSetWidth(w);
        this.update();
    }

    private innerSetWidth(w: number): void {
        this.desc.width = w;
        this.shapeHolder.width(w);
    }

    public height(): number {
        return Number(this.shapeHolder.height());
    }

    public setHeight(w: number): void {
        this.innerSetHeight(w);
        this.update();
    }

    public innerSetHeight(w: number): void {
        this.desc.height = w;
        this.shapeHolder.height(w);
    }

    public getTopCenter(): Coord {
        return { x: this.root.cx(), y: Number(this.root.y()) };
    }

    public getBottomCenter(): Coord {
        return { x: this.root.cx(), y: Number(this.root.y()) + Number(this.root.height()) };
    }

    public getLeftCenter(): Coord {
        return {
            x: this.root.cx() - Number(this.root.width()) / 2.0,
            y: Number(this.root.y()) + Number(this.root.height()) / 2.0,
        };
    }

    public getRightCenter(): Coord {
        return {
            x: this.root.cx() + Number(this.root.width()) / 2.0,
            y: Number(this.root.y()) + Number(this.root.height()) / 2.0,
        };
    }

    public SceneCoordToLocalCoord(scenePoint: Coord): Coord {
        return { x: scenePoint.x - this.root.cx(), y: scenePoint.y - this.root.cy() };
    }

    public LocalCoordToSceneCoord(offsetPoint: Coord): Coord {
        return { x: offsetPoint.x + this.root.cx(), y: offsetPoint.y + this.root.cy() };
    }

    public moveCenter(cx: number, cy: number): void {
        this.desc.centerPosition = { x: cx, y: cy };
        this.root.cx(cx);
        this.root.cy(cy);
    }

    public moveLabel(cx: number, cy: number): void {
        const relPos = coord(cx - Number(this.root.x()), cy - Number(this.root.y()));
        this.moveLabelRelative(relPos.x, relPos.y);
    }

    public moveLabelRelative(cx: number, cy: number): void {
        this.desc.textPosition = { x: cx, y: cy };
        this.nameHolder.center(cx, cy);
    }

    private addMovementHandlers(group: Container): void {
        group.draggable();
        const cb = (_event: MouseEvent) => {
            this.desc.centerPosition = { x: this.root.cx(), y: this.root.cy() };
            this.dragCallback?.(this);
        };
        this.getRoot().on("dragmove.namespace", cb as EventListener);
    }

    public onMove(callback: (box: Box) => void): void {
        this.dragCallback = callback;
    }
}
