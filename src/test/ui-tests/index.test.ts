import { expect } from "chai";

import * as vscode from "vscode";
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    test("Sample test", () => {
        expect([1, 2, 3].indexOf(5)).to.eq(-1);
        expect([1, 2, 3].indexOf(0)).to.eq(-1);
    });
});
