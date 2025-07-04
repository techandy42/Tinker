import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const command = 'tinker.showMessage';
    const disposable = vscode.commands.registerCommand(command, () => {
        vscode.window.showInformationMessage('Tinker', { modal: true });
    });
    context.subscriptions.push(disposable);

    // automatically show the popup on activation
    vscode.commands.executeCommand(command);
}

export function deactivate() {}
