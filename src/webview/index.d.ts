declare module "*.ttf";

declare module "@svgdotjs/svg.js" {
    interface Svg {
        zoom(level: null, point?: { x: number; y: number }): number;
        zoom(level: number, point?: { x: number; y: number }): this;
    }
}
