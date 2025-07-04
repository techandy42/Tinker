import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const command = 'tinker.openChat';
    const disposable = vscode.commands.registerCommand(command, () => {
        const panel = vscode.window.createWebviewPanel(
            'tinkerChat',
            'Tinker',
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getWebviewContent();

        const tinkerServer = (text: string): string => {
            return `Tinker server response: ${text}`;
        };

        panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'send') {
                    const response = tinkerServer(message.text);
                    panel.webview.postMessage({ command: 'response', text: response });
                }
            },
            undefined,
            context.subscriptions
        );
    });
    context.subscriptions.push(disposable);

    vscode.commands.executeCommand(command);
}

function getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: sans-serif; margin: 0; padding: 10px; }
#messages { margin-top: 10px; }
.msg { margin: 5px 0; }
</style>
</head>
<body>
<input id="input" type="text" placeholder="Enter command" style="width:80%;" />
<button id="send">Enter</button>
<div id="messages"></div>
<script>
const vscode = acquireVsCodeApi();
const input = document.getElementById('input');
const messages = document.getElementById('messages');
document.getElementById('send').addEventListener('click', send);
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        send();
    }
});
window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.command === 'response') {
        const div = document.createElement('div');
        div.textContent = msg.text;
        div.className = 'msg';
        messages.appendChild(div);
    }
});
function send() {
    const text = input.value;
    if (!text.trim()) { return; }
    vscode.postMessage({ command: 'send', text });
    input.value = '';
}
</script>
</body>
</html>`;
}

export function deactivate() {}
