import * as vscode from "vscode";

export class Logger {
    private readonly channel: vscode.OutputChannel;

    public constructor(channel: string) {
        this.channel = vscode.window.createOutputChannel(channel);
    }

    /** Writes log message line into the Output channel of the host VSCode (Where the extension instance runs) */
    public log(message: string): void {
        // use date-fns package in future?
        this.channel.appendLine(`${new Date().toISOString()} - ` + message);
        Logger.logDevConsole(message);
    }

    /** Writes log message (without newline) into the Output channel of the host VSCode (Where the extension instance runs) */
    public logRaw(message: string): void {
        // use date-fns package in future?
        this.channel.append(`${new Date().toISOString()} - ` + message);
        Logger.logDevConsole(message);
    }

    /** Writes a log message into the Debug console of the developer VSCode */
    public static logDevConsole(message: string): void {
        console.log(`${new Date().toISOString()} - ` + message);
    }
}
