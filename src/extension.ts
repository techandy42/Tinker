import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const command = 'tinker.showMessage';
    const disposable = vscode.commands.registerCommand(command, () => {
        const panel = vscode.window.createWebviewPanel(
            'tinkerWelcome',
            'Tinker',
            vscode.ViewColumn.One,
            {}
        );
        panel.webview.html = getWebviewContent();
    });
    context.subscriptions.push(disposable);

    // automatically show the screen on activation
    vscode.commands.executeCommand(command);
}

function getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tinker</title>
</head>
<body>
    <h1>Tinker</h1>
</body>
</html>`;
}

export function deactivate() {}
