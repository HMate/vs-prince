/**
 * Copied from https://github.com/shrhdk/text-to-svg/blob/master/src/index.js
 */

import opentype from "opentype.js";

const DEFAULT_FONT = "fonts/ipag.ttf";

// Private method

function parseAnchorOption(anchor: string) {
    let hMatch = anchor.match(/left|center|right/gi) || [];
    let horizontal = hMatch.length === 0 ? "left" : hMatch[0];

    let vMatch = anchor.match(/baseline|top|bottom|middle/gi) || [];
    let vertical = vMatch.length === 0 ? "baseline" : vMatch[0];

    return { horizontal, vertical };
}

export interface TTSOptions {
    anchor?: string;
    y?: number;
    x?: number;
    tracking?: number;
    letterSpacing?: number;
    fontSize?: number;
    kerning?: boolean;
}

export default class TextToSVG {
    constructor(private font: opentype.Font) {}

    // static loadSync(file = DEFAULT_FONT) {
    //     return new TextToSVG(opentype.loadSync(file));
    // }

    static load(url: string, cb: (error: any, font: TextToSVG | null) => void | Promise<opentype.Font>) {
        opentype.load(url, (err, font) => {
            if (err != null || font == null) {
                return cb(err, null);
            }

            return cb(null, new TextToSVG(font));
        });
    }

    getWidth(text: string, options: TTSOptions) {
        const fontSize = options.fontSize || 72;
        const kerning = "kerning" in options ? options.kerning : true;
        const fontScale = (1 / this.font.unitsPerEm) * fontSize;

        let width = 0;
        const glyphs = this.font.stringToGlyphs(text);
        for (let i = 0; i < glyphs.length; i++) {
            const glyph = glyphs[i];

            if (glyph.advanceWidth) {
                width += glyph.advanceWidth * fontScale;
            }

            if (kerning && i < glyphs.length - 1) {
                const kerningValue = this.font.getKerningValue(glyph, glyphs[i + 1]);
                width += kerningValue * fontScale;
            }

            if (options.letterSpacing) {
                width += options.letterSpacing * fontSize;
            } else if (options.tracking) {
                width += (options.tracking / 1000) * fontSize;
            }
        }
        return width;
    }

    getHeight(fontSize: number) {
        const fontScale = (1 / this.font.unitsPerEm) * fontSize;
        return (this.font.ascender - this.font.descender) * fontScale;
    }

    getMetrics(text: string, options: TTSOptions = {}) {
        const fontSize = options.fontSize || 72;
        const anchor = parseAnchorOption(options.anchor || "");

        const width = this.getWidth(text, options);
        const height = this.getHeight(fontSize);

        const fontScale = (1 / this.font.unitsPerEm) * fontSize;
        const ascender = this.font.ascender * fontScale;
        const descender = this.font.descender * fontScale;

        let x = options.x || 0;
        switch (anchor.horizontal) {
            case "left":
                x -= 0;
                break;
            case "center":
                x -= width / 2;
                break;
            case "right":
                x -= width;
                break;
            default:
                throw new Error(`Unknown anchor option: ${anchor.horizontal}`);
        }

        let y = options.y || 0;
        switch (anchor.vertical) {
            case "baseline":
                y -= ascender;
                break;
            case "top":
                y -= 0;
                break;
            case "middle":
                y -= height / 2;
                break;
            case "bottom":
                y -= height;
                break;
            default:
                throw new Error(`Unknown anchor option: ${anchor.vertical}`);
        }

        const baseline = y + ascender;

        return {
            x,
            y,
            baseline,
            width,
            height,
            ascender,
            descender,
        };
    }
}

module.exports = exports.default;
