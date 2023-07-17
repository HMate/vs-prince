const path = require("node:path");
const fs = require("node:fs");

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`Usage: node pyprince-prepare-script <full-path-to-output-dir>`);
    console.log(`Description: This script copies the runtime required python files to the given directory.`);
    return 0;
}

const pyprincePath = path.join(path.dirname(__dirname), "node_modules/@mhidvegi/pyprince/pyprince");
const resultPath = path.join(args[0], "pyprince");
if (fs.existsSync(resultPath)) {
    console.log(`Remove ${resultPath}`);
    fs.rmSync(resultPath, { recursive: true });
}
console.log(`Copy ${pyprincePath} to ${args[0]}`);
fs.cpSync(pyprincePath, resultPath, { recursive: true, preserveTimestamps: true });
