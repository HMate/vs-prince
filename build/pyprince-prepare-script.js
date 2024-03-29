const path = require("node:path");
const fs = require("node:fs");

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`Usage: node pyprince-prepare-script <full-path-to-output-dir>`);
    console.log(`Description: This script copies the runtime required python files to the given directory.`);
    return 0;
}

const pyprincePath = path.join(path.dirname(__dirname), "node_modules/@mhidvegi/pyprince/pyprince.pyz");
console.log(`Copy ${pyprincePath} to ${path.join(args[0], "pyprince.pyz")}`);
fs.copyFileSync(pyprincePath, path.join(args[0], "pyprince.pyz"));
