const { spawn } = require("child_process");

function runProcess(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { shell: true, ...options });

        proc.stdout.on("data", (data) => process.stdout.write(data));
        proc.stderr.on("data", (data) => process.stderr.write(data));

        proc.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${command} exited with code ${code}`));
            }
        });
    });
}

async function main() {
    try {
        await runProcess("npm", ["run", "create-link"], { cwd: "F:\\projects\\pyprince\\npm-package" });
        await runProcess("npm", ["link", "@mhidvegi/pyprince"], { cwd: process.cwd() });
        console.log("Both scripts executed successfully.");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
