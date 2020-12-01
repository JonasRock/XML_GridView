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
        webviewPanel.webview.onDidReceiveMessage(message => (handleMessage(document, webviewPanel, message)));
        webviewPanel.webview.postMessage(createMessage("init", null));
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptJQueryUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'js', 'lib', 'jquery-3.5.1.min.js')
        ));
        const scriptJson2htmlUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'js', 'lib', 'json2html.js')
        ));
        const scriptVisualizerUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'js', 'lib', 'visualizer.js')
        ));
        const scriptGetXMLContentUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'js', 'getXMLContent.js')
        ));
        const styleVisualizerUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'css', 'visualizer.css')
        ));

        const nonce = getNonce();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">

                <title>XML Grid View</title>

                <link href="${styleVisualizerUri}" rel="stylesheet">

            </head>

            <body>

                <div id="output">
                    <input id="loadContent" type="button" value="Load Content"/>
                </div>

                <script nonce="${nonce}" src="${scriptJQueryUri}"></script>
                <script nonce="${nonce}" src="${scriptJson2htmlUri}"></script>
                <script nonce="${nonce}" src="${scriptVisualizerUri}"></script>
                <script nonce="${nonce}" src="${scriptGetXMLContentUri}"></script>

            </body>
            </html>`;
    }
}

function handleMessage(document: vscode.TextDocument, panel: vscode.WebviewPanel, message: Message) : void {
    switch (message.method) {
        case "init":
            var parser = require('fast-xml-parser');
            var jsonObj = parser.parse(document.getText());
            panel.webview.postMessage(createMessage("content", jsonObj));
    }
}