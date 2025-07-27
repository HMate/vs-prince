import { defineConfig } from "@vscode/test-cli";

// docs:
// https://github.com/microsoft/vscode-test-cli
// https://mochajs.org/api/mocha
export default defineConfig([
    {
        label: "unitTests",
        files: "out/test/unit-tests/**/*.test.js",
        mocha: {
            ui: "bdd",
            timeout: "20s",
        },
    },
    {
        label: "UITests",
        require: "ts-node/register",
        files: "src/test/ui-tests/*.test.ts",
        workspaceFolder: "./test-workspace",
        mocha: {
            require: ["ts-node/register"],
            ui: "tdd",
            timeout: "20s",
        },
    },
    // you can specify additional test configurations, too
]);
