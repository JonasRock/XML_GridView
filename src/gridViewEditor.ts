import * as path from 'path';
import * as vscode from 'vscode';
import { getNonce, createMessage, Message } from './util';

export class GridViewEditorProvider implements vscode.CustomTextEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new GridViewEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(GridViewEditorProvider.viewType, provider);
        return providerRegistration;
    }

    private static readonly viewType = 'xml-grid-view.gridView';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ) : Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        webviewPanel.webview.onDidReceiveMessage(message => (handleMessage(webviewPanel, message)));
        webviewPanel.webview.postMessage(createMessage("init", null));
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'js', 'getXMLContent.js')
        ));

        const nonce = getNonce();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>XML Grid View</title>
            </head>
            <body>
                <div id="mainBody">
                    <input id="loadContent" type="button" value="Load Content"/>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function handleMessage(panel: vscode.WebviewPanel, message: Message) : void {
    switch (message.method) {
        case "init": panel.webview.postMessage(createMessage("content", "Hello there!"));
    }
}