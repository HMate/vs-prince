import { Svg, SVG, Element, Rect, Text, Circle, Container } from "@svgdotjs/svg.js";
import { Marker, Polygon, Box } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.panzoom.js";

import SvgComplexContainer from "./svgElements/SvgComplexContainer";
import { Coord, Point } from "./utils";
import TextToSVG from "./TextToSvg";
import { Point as SvgPoint } from "@svgdotjs/svg.js";

export interface CameraState {
    zoomLevel: number;
    zoomPoint: Coord;
    cameraViewbox: { x: number; y: number; width: number; height: number };
}

export class SvgVisualizationBuilder {
    readonly root: Svg;
    private readonly registeredDefs: { [id: string]: Marker } = {};
    private cameraProperties: CameraState = {
        zoomLevel: 1,
        zoomPoint: { x: 0, y: 0 },
        cameraViewbox: { x: 0, y: 0, width: 0, height: 0 },
    };

    constructor(rootId: string, protected tts: TextToSVG) {
        const bodyRect = document?.getElementsByTagName("body")?.item(0)?.getBoundingClientRect();
        const windowSize =
            bodyRect != null ? { width: bodyRect.width, height: bodyRect.height } : { width: 1600, height: 1200 };

        this.root = SVG().addTo("body").size(windowSize.width, windowSize.height);
        this.root.id(`#${rootId}`);
        this.root.addClass(`${rootId}-root`);
        this.root.viewbox(0, 0, windowSize.width, windowSize.height);
        this.cameraProperties.zoomLevel = this.root.zoom();
        this.cameraProperties.cameraViewbox = this.root.viewbox();
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

    /** Polygon coordinate origin is in left-top. */
    public createPolygon(points: Array<Point>): Polygon {
        return this.root.polygon(points.map((p) => `${p[0]},${p[1]}`).join(" "));
    }

    /** Initializes the camera for the scene. The callback gets invoked after camera pan and zoom events */
    public initCamera(onCameraEventCallback?: (builder: this) => void): void {
        this.root.panZoom({ zoomMin: 0.2, zoomMax: 2, zoomFactor: 0.1 });
        this.root.on("panEnd", (_ev: Event) => {
            onCameraEventCallback?.(this);
        });
        this.root.on("panning", ((ev: CustomEvent<{ box: Box; event: MouseEvent }>) => {
            this.cameraProperties.cameraViewbox = ev.detail.box;
        }) as EventListener);
        this.root.on("zoom", ((ev: CustomEvent<{ level: number; focus: Coord }>) => {
            this.cameraProperties.zoomLevel = ev.detail.level;
            this.cameraProperties.zoomPoint = ev.detail.focus;
            onCameraEventCallback?.(this);
        }) as EventListener);
    }

    public getCameraState(): CameraState {
        return this.cameraProperties;
    }

    public setCamera(state: CameraState): void {
        this.cameraProperties = state;
        this.root.zoom(state.zoomLevel, new SvgPoint(state.zoomPoint.x, state.zoomPoint.y));
        this.root.viewbox(state.cameraViewbox);
    }
}
