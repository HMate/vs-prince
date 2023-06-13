import { Svg, SVG, Element, Rect, Text, Circle, Container } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.panzoom.js";
import { Marker, Polygon } from "@svgdotjs/svg.js";

import SvgComplexContainer from "./svgElements/SvgComplexContainer";
import { Point } from "./utils";
import TextToSVG from "./TextToSvg";

export class SvgVisualizationBuilder {
    readonly root: Svg;
    private readonly registeredDefs: { [id: string]: Marker } = {};
    constructor(rootId: string, protected tts: TextToSVG) {
        const bodyRect = document?.getElementsByTagName("body")?.item(0)?.getBoundingClientRect();
        const windowSize =
            bodyRect != null ? { width: bodyRect.width, height: bodyRect.height } : { width: 1600, height: 1200 };

        this.root = SVG().addTo("body").size(windowSize.width, windowSize.height);
        this.root.id(`#${rootId}`);
        this.root.addClass(`${rootId}-root`);
        this.root.viewbox(0, 0, windowSize.width, windowSize.height);
    }

    public addChildToGroup(group: Container, child: Element): void {
        group.add(child);
    }

    public addChildToRoot(child: Element): void {
        this.root.add(child);
    }

    public removeFromRoot(child: Element): void {
        this.root.removeElement(child);
    }

    public removeAllElements(): void {
        for (const child of this.root.children()) {
            child.remove();
        }
    }

    public registerDef(
        name: string,
        width: number,
        height: number,
        block?: ((marker: Marker) => void) | undefined
    ): Marker {
        if (name in this.registeredDefs) {
            return this.registeredDefs[name];
        }
        const defs = this.root.defs();
        const marker = defs.marker(width, height, block);
        this.registeredDefs[name] = marker;
        return marker;
    }

    public createRect(): Rect {
        return this.root.rect();
    }

    public createCircle(): Circle {
        return this.root.circle();
    }

    public createGroup(): Container {
        const dd = new SvgComplexContainer();
        return dd;
    }

    public createText(text: string): Text {
        return this.root.text(text);
    }

    /**
     * Polygon coordinate origin is in left-top.
     */
    public createPolygon(points: Array<Point>): Polygon {
        return this.root.polygon(points.map((p) => `${p[0]},${p[1]}`).join(" "));
    }

    public addCameraHandlers(): void {
        this.root.panZoom({ zoomMin: 0.2, zoomMax: 2, zoomFactor: 0.1 });
    }
}
