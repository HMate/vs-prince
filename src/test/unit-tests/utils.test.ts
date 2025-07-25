import { expect } from "chai";

import { range } from "../../webview/utils";

describe("Range utils", () => {
    it("with range to 0", () => {
        const r = range(0);
        expect(r).to.eql([]);
    });

    it("with range to 3", () => {
        const r = range(3);
        expect(r).to.eql([0, 1, 2]);
    });

    it("with range to 15", () => {
        expect(range(15)).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    });

    it("with explicit 0", () => {
        expect(range(0, 15)).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    });

    it("with positive from value", () => {
        expect(range(6, 9)).to.eql([6, 7, 8]);
    });

    it("with negative start value", () => {
        const r = range(-3, 6);
        expect(r).to.eql([-3, -2, -1, 0, 1, 2, 3, 4, 5]);
    });

    it("with equal from to", () => {
        const r = range(2, 2);
        expect(r).to.eql([]);
    });

    it("with inverted from to", () => {
        const r = range(5, 2);
        expect(r).to.eql([5, 4, 3]);
    });
});
