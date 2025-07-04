import * as vscode from 'vscode';
import { completion } from 'litellm';

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

        const messages: { role: 'user' | 'assistant'; content: string }[] = [];

        const tinkerServer = async (text: string, apiKey: string): Promise<string> => {
            process.env['OPENAI_API_KEY'] = apiKey;
            messages.push({ role: 'user', content: text });
            const resp = await completion({
                model: 'gpt-4-1106-preview',
                messages: messages.map(m => ({ role: m.role, content: m.content }))
            });
            const assistant = resp.choices[0]?.message?.content || '';
            messages.push({ role: 'assistant', content: assistant });
            return assistant;
        };

        panel.webview.onDidReceiveMessage(
            async message => {
                if (message.command === 'send') {
                    try {
                        const response = await tinkerServer(message.text, message.apiKey || '');
                        panel.webview.postMessage({ command: 'response', text: response });
                    } catch (err: any) {
                        panel.webview.postMessage({ command: 'response', text: `Error: ${err.message}` });
                    }
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
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; margin: 0; padding: 10px; background-color: #0d1117; color: #c9d1d9; }
#messages { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.message { padding: 8px 12px; border-radius: 6px; max-width: 80%; white-space: pre-wrap; }
.user { align-self: flex-end; background-color: #238636; color: #ffffff; }
.assistant { align-self: flex-start; background-color: #161b22; }
#input-bar { display: flex; gap: 6px; }
input[type="text"], input[type="password"] { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #30363d; background-color: #0d1117; color: #c9d1d9; }
#apiKey { max-width: 250px; }
button { padding: 8px 12px; border-radius: 6px; border: none; background-color: #238636; color: #fff; }
</style>
</head>
<body>
<div id="input-bar">
    <input id="input" type="text" placeholder="Enter command" />
    <input id="apiKey" type="password" placeholder="OpenAI API Key" />
    <button id="send">Send</button>
</div>
<div id="messages"></div>
<script>
const vscode = acquireVsCodeApi();
const input = document.getElementById('input');
const apiInput = document.getElementById('apiKey');
const messagesDiv = document.getElementById('messages');
document.getElementById('send').addEventListener('click', send);
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        send();
    }
});
window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.command === 'response') {
        addMessage('assistant', msg.text);
    }
});
function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'message ' + role;
    div.textContent = (role === 'user' ? 'User' : 'Assistant') + ': ' + text;
    messagesDiv.appendChild(div);
}
function send() {
    const text = input.value;
    if (!text.trim()) { return; }
    addMessage('user', text);
    vscode.postMessage({ command: 'send', text, apiKey: apiInput.value });
    input.value = '';
}
</script>
</body>
</html>`;
}

export function deactivate() {}
