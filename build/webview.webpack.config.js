"use strict";

const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { TsconfigPathsPlugin } = require("tsconfig-paths-webpack-plugin");

class WatchTimerPlugin {
    apply(compiler) {
        compiler.hooks.done.tap("Watch Timer Plugin", (stats) => {
            console.log("\n[" + new Date().toLocaleString() + "] --- Webview done.\n");
        });
    }
}

/**@type {import('webpack').Configuration}*/
const config = {
    target: "web",
    mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

    // With inline-, we can debug ts files inside the webdeveloper tools of vscode. With cheap- the build is faster.
    // For debugging we only have to reopen the tab in the test vscode, no need to restart the window itself.
    devtool: "inline-cheap-source-map",
    entry: { index: "./src/webview/webview.ts" },
    output: {
        // the bundle for the webview is stored in the 'media' folder, 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, "..", "media"),
        filename: "webview.js",
        library: {
            name: "webviewPrince",
            type: "window",
        },
        publicPath: "",
    },
    resolve: {
        // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: [".ts", ".js", ".html", ".ttf", ".gif"],
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
            {
                test: /\.html$/,
            },
            {
                test: /\.ttf$/i,
                type: "asset/resource",
                generator: {
                    filename: "resources/font/[name][ext][query]",
                },
            },
            {
                test: /\.(scss|css)$/,
                exclude: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "resolve-url-loader",
                    { loader: "sass-loader", options: { sourceMap: true } },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "./index.html",
            template: "./src/webview/index.html",
            inject: false,
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({ filename: "webview-style.css" }),
        new WatchTimerPlugin(),
        new CopyPlugin({
            patterns: [{ from: "./src/webview/resources/image", to: "resources/image" }],
        }),
    ],
};
module.exports = config;
