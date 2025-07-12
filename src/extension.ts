import * as vscode from 'vscode';

const VIEW_ID = 'tinkerChatView';

/** Sidebar chat view provider. */
class TinkerChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private readonly messages: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getWebviewContent();

    webviewView.webview.onDidReceiveMessage(
      async (msg: { command: string; text: string; apiKey?: string }) => {
        if (msg.command !== 'send') return;
        try {
          const reply = await this.callClaude(msg.text, msg.apiKey ?? '');
          webviewView.webview.postMessage({ command: 'response', text: reply });
        } catch (err: any) {
          webviewView.webview.postMessage({
            command: 'response',
            text: `Error: ${err?.message ?? String(err)}`
          });
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private async callClaude(userText: string, apiKey: string): Promise<string> {
    this.messages.push({ role: 'user', content: userText });
  
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: this.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });
  
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText);
    }
  
    const data = await response.json() as {
      content?: { text?: string }[];
    };
    const assistant = data.content?.[0]?.text || '';
    this.messages.push({ role: 'assistant', content: assistant });
    return assistant;
  }

  /** Returns HTML/JS for the webview. */
  private getWebviewContent(): string {
    return /* html */ `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;padding:10px;background:#0d1117;color:#c9d1d9;}
#messages{margin-top:10px;display:flex;flex-direction:column;gap:6px;}
.message{padding:8px 12px;border-radius:6px;max-width:80%;white-space:pre-wrap;}
.user{align-self:flex-end;background:#238636;color:#fff;}
.assistant{align-self:flex-start;background:#161b22;color:#c9d1d9;}
#input-bar{display:flex;gap:6px;}
input[type=text],input[type=password]{flex:1;padding:8px;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:#c9d1d9;}
#apiKey{max-width:230px;}
button{padding:8px 12px;border:none;border-radius:6px;background:#238636;color:#fff;cursor:pointer;}
</style>
</head><body>
<div id="input-bar">
  <input id="input" type="text" placeholder="Enter command">
  <input id="apiKey" type="password" placeholder="Anthropic API Key">
  <button id="send">Send</button>
</div>
<div id="messages"></div>
<script>
const vscode = acquireVsCodeApi();
const input = document.getElementById('input');
const apiInput = document.getElementById('apiKey');
const messagesDiv = document.getElementById('messages');

document.getElementById('send').addEventListener('click', send);
input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

window.addEventListener('message', event => {
  if (event.data.command === 'response') addMsg('assistant', event.data.text);
});

function addMsg(role, text){
  const div = document.createElement('div');
  div.className = 'message ' + role;
  div.textContent = (role === 'user' ? 'User: ' : 'Assistant: ') + text;
  messagesDiv.appendChild(div);
  div.scrollIntoView({behavior:'smooth',block:'end'});
}

function send(){
  const text = input.value.trim();
  if (!text) return;
  addMsg('user', text);
  vscode.postMessage({ command: 'send', text, apiKey: apiInput.value });
  input.value = '';
}
</script>
</body></html>`;
  }
}

/** Extension entry-point. */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      VIEW_ID,
      new TinkerChatViewProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('tinker.openChat', () =>
      vscode.commands.executeCommand(`${VIEW_ID}.focus`)
    )
  );
}

export function deactivate() {}
