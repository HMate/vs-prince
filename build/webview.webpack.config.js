//@ts-check

"use strict";

const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

/**@type {import('webpack').Configuration}*/
const config = {
    target: "electron-renderer",
    mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

    devtool: "source-map",
    entry: "./src/webview/webview.ts",
    output: {
        // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, "..", "media"),
        filename: "webview.js",
        libraryTarget: "window",
        publicPath: "",
    },
    resolve: {
        // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: [".ts", ".js", ".html", ".ttf"],
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
                test: /\.ttf$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "./font/[name].[ext]",
                        },
                    },
                ],
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
    ],
};
module.exports = config;
