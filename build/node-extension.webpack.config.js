"use strict";

const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { TsconfigPathsPlugin } = require("tsconfig-paths-webpack-plugin");

class WatchTimerPlugin {
    apply(compiler) {
        compiler.hooks.done.tap("Watch Timer Plugin", (stats) => {
            console.log("\n[" + new Date().toLocaleString() + "] --- Extension done.\n");
        });
    }
}

/**@type {import('webpack').Configuration}*/
const config = {
    target: "node", // vscode extensions run in a Node.js-context - uses require 📖 -> https://webpack.js.org/configuration/target/
    mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

    entry: "./src/extension.ts", // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
        // the bundle is stored in the 'dist' folder (connected to package.json "main" entry), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, "..", "dist"),
        filename: "extension.js",
        libraryTarget: "commonjs2",
    },
    devtool: "source-map",
    externals: {
        vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: {
        // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: [".ts", ".js", ".html"],
        plugins: [
            new TsconfigPathsPlugin({
                /* options: see https://www.npmjs.com/package/tsconfig-paths-webpack-plugin */
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
        ],
    },
    plugins: [new CleanWebpackPlugin(), new WatchTimerPlugin()],
};
module.exports = config;
