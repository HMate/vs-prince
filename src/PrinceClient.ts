import child_process from "child_process";

export class PrinceClient {
    public static callPrince(...args: string[]): string {
        return child_process
            .execFileSync("poetry", ["run", "python", "-m", "pyprince", ...args], { cwd: "D:\\projects\\pyprince" })
            .toString();
    }
}
