# Project vision

Vsc-Prince is a VSCode extension to visualize code.
For now it just visualizes python import/package hierarchy.
In the future I would like to further develop it to visualize call chains, class hierarchies.

In the far future I would like to to even further develop it to visualize code flow, data flow. Abstract 
representation of code that is deattached from the concrete language the code was written in. To show computation 
constructs instead of code constructs. For example a for loop can be shown as functional-flowstyle. Or a switch case 
as a type inheritance and vice-versa.

An another visualiation idea is to show code inside graph nodes. Function calls can be shown immediately to the right 
in another box. Would make it easy to oversee call chains.

## Architecture for Prince

Consists if two layers:
- Visualization client - VSCode extension - vsc-prince
- Language servers - For now only a python backend - pyprince

## Vsc-Prince

Consists of:
- VSCode extension
    - Description
        - Entrypoint for extension code
        - Handle Settings
        - Handles inputs from vscode, file operations
        - Calls into and mediates between webview and language servers
    - Technology 
        - Typescript
        - Tooling:
            - npm 10.8.2
- Webview
    - Description
        - Draw the visualizations - See layout_engine_overview.md
        - Handle interactions
            - Opens files based on interactions on the visualization
    - Technology 
        - Typescript + VSCode lib calls

## PyPrince

See https://github.com/HMate/pyprince.

Parses python code.\
Has to parse code into format that can be handled by the client.\
Has to be fast.


## Testing

I need to exepriment with a lot of things in the extension. 
The javascript ecosystem is new to me, the langauge evolves rapdily, and needs a lot of tooling.
I started without writing tests because it seemed to slow me down.
But the visualization code is hard to edit, it can break down easily, it has to handle a lot of edgecases of vscode 
and graph drawing.

I think I will need to make at least end-to-end tests to handle these.

Candidates:
- wdio-vscode-service
    - https://github.com/webdriverio-community/wdio-vscode-service
    - This is a vscode wrapper around WebdriverIO
- vscode-extester
    - https://code.visualstudio.com/api/working-with-extensions/testing-extension
    - https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner
    - https://github.com/microsoft/vscode-test-cli/blob/main/README.md -> config options
    - I had to create a separate build step for test code so it can be loaded with vscextest + mocha + 
- Playwright
    - Turned out vscode-extester + playwright cannot create a webview that I can communicate with
- Percy 
    - Seems to be specialized for screenshot comparison for websites.
    - Gives a whole backend, review pipeline for it - That is probably too 
        much for my use case.
- Puppeteer - Its seems to not support VsCode
- Cypress - ? Seems too heavyweight

Testing library:
- Mocha - seems good enough
    - I either have to compile to js files, or use ts-node or tsx to interpret ts test files
- Jest - Not sure about the difference to mocha

## Building

in short for development:
- run `npm run link-pyprince`
- run `npm run compile`

for production package:
- run `npm run package`

Two ways to compile ts to js: run tsc or webpack.
Because we do a bunch of different kind of bundling, css transpiling, etc we use webpack.
For ui-tests we currently use tsc, because it was easier to set up with ts-node. Later this may need to be changed to webpack too.

The codebase uses ESM style import-export (because that is given by typescript), 
but compiles to CommonJS style require imports, because that is recommended by VSCode.
For ts-node we do the conversion to commonjs in tsconfig. 
In webpack we do it in the last step in node-extension.webpack.config.js.
Before that the tsconfig still compiles the ts files into js files with esm imports. Why? I'm not sure, but is works for now.
