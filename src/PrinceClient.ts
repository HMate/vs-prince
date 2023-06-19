import child_process from "child_process";

export class PrinceClient {
    public static callPrince(...args: string[]): string {
        // TODO: somehow put this whole call in a library, remove poetry dependency and hardcoded path
        return child_process
            .execFileSync("poetry", ["run", "python", "-m", "pyprince", ...args], { cwd: "C:\\projects\\pyprince" })
            .toString();
    }
}
