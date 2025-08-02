import * as vscode from 'vscode';

export class OutputChannelLogger {
    private outputChannel: vscode.OutputChannel;

    constructor(name: string) {
        this.outputChannel = vscode.window.createOutputChannel(name);
    }

    log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    logWithEmoji(emoji: string, message: string): void {
        this.log(`${emoji} ${message}`);
    }

    info(message: string): void {
        this.logWithEmoji('ℹ️', message);
    }

    success(message: string): void {
        this.logWithEmoji('✅', message);
    }

    warning(message: string): void {
        this.logWithEmoji('⚠️', message);
    }

    error(message: string): void {
        this.logWithEmoji('❌', message);
    }

    debug(message: string): void {
        this.logWithEmoji('🐛', message);
    }

    show(): void {
        this.outputChannel.show();
    }

    hide(): void {
        this.outputChannel.hide();
    }

    clear(): void {
        this.outputChannel.clear();
    }

    dispose(): void {
        this.outputChannel.dispose();
    }
}
