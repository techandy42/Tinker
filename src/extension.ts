import * as vscode from 'vscode';
import { completion } from 'litellm';

/** The view id must match the one you declare in package.json. */
const VIEW_ID = 'tinkerChatView';

/** Sidebar (“Cursor-like”) chat view provider. */
class TinkerChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private readonly messages: { role: 'user' | 'assistant'; content: string }[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {}

  /** Called whenever VS Code needs to create or restore the view. */
  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    webviewView.webview.options = { enableScripts: true };

    webviewView.webview.html = this.getWebviewContent();

    webviewView.webview.onDidReceiveMessage(
      async (msg: { command: string; text: string; apiKey?: string }) => {
        if (msg.command !== 'send') { return; }

        try {
          const reply = await this.callLLM(msg.text, msg.apiKey ?? '');
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

  /** Calls the LLM and keeps chat history. */
  private async callLLM(userText: string, apiKey: string): Promise<string> {
    process.env.OPENAI_API_KEY = apiKey;
    this.messages.push({ role: 'user', content: userText });

    const resp = await completion({
      model: 'gpt-4-1106-preview',
      messages: this.messages.map(m => ({ role: m.role, content: m.content }))
    });

    const assistant = resp.choices[0]?.message?.content ?? '';
    this.messages.push({ role: 'assistant', content: assistant });
    return assistant;
  }

  /** Returns the HTML/JS payload for the sidebar. */
  private getWebviewContent(): string {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;margin:0;padding:10px;background:#0d1117;color:#c9d1d9;}
#messages{margin-top:10px;display:flex;flex-direction:column;gap:6px;}
.message{padding:8px 12px;border-radius:6px;max-width:80%;white-space:pre-wrap;}
.user{align-self:flex-end;background:#238636;color:#fff;}
.assistant{align-self:flex-start;background:#161b22;color:#c9d1d9;}
#input-bar{display:flex;gap:6px;}
input[type=text],input[type=password]{flex:1;padding:8px;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:#c9d1d9;}
#apiKey{max-width:250px;}
button{padding:8px 12px;border:none;border-radius:6px;background:#238636;color:#fff;cursor:pointer;}
</style>
</head>
<body>
<div id="input-bar">
  <input id="input" type="text" placeholder="Enter command">
  <input id="apiKey" type="password" placeholder="OpenAI API Key">
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
  if (event.data.command === 'response') addMessage('assistant', event.data.text);
});

function addMessage(role, text){
  const div = document.createElement('div');
  div.className = 'message '+role;
  div.textContent = (role==='user'?'User: ':'Assistant: ')+text;
  messagesDiv.appendChild(div);
  div.scrollIntoView({behavior:'smooth',block:'end'});
}

function send(){
  const text = input.value.trim();
  if(!text) return;
  addMessage('user', text);
  vscode.postMessage({command:'send', text, apiKey:apiInput.value});
  input.value='';
}
</script>
</body>
</html>`;
  }
}

/** Extension entry-point. */
export function activate(context: vscode.ExtensionContext) {
  // ➊ Register the Webview-view provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      VIEW_ID,
      new TinkerChatViewProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // ➋ Command that opens the right-hand sidebar and shows the chat
  context.subscriptions.push(
    vscode.commands.registerCommand('tinker.openChat', async () => {
      // Make sure the Auxiliary (right-hand) bar is visible and focussed
      await vscode.commands.executeCommand('workbench.action.focusAuxiliaryBar'); //  [oai_citation:0‡Gist](https://gist.github.com/skfarhat/4e88ef386c93b9dceb98121d9457edbf?utm_source=chatgpt.com)
      // Now focus the chat view itself
      await vscode.commands.executeCommand(`${VIEW_ID}.focus`);
    })
  );
}

export function deactivate() {}
