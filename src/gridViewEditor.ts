import * as path from 'path';
import * as vscode from 'vscode';
import { getNonce, createMessage, Message } from './util';
import * as net from 'net';
import { CommunicationHandler } from './communicationHandler';

export class GridViewEditorProvider implements vscode.CustomTextEditorProvider {

    public static register(context: vscode.ExtensionContext, socket: net.Socket): vscode.Disposable {
        const provider = new GridViewEditorProvider(context, socket);
        
        const providerRegistration = vscode.window.registerCustomEditorProvider(GridViewEditorProvider.viewType, provider);
        return providerRegistration;
    }

    private static readonly viewType = 'xml-grid-view.gridView';
    private id: number = 0;
    private commHandler: CommunicationHandler | undefined = undefined;
    
    constructor(
        private readonly context: vscode.ExtensionContext,
        private socket: net.Socket
    ) {}

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ) : Promise<void> {
        this.commHandler = new CommunicationHandler(this.socket, webviewPanel);
        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);
    }

    private getHtmlForWebview(webview: vscode.Webview, document: vscode.TextDocument): string {
        const scriptGetXMLContentUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'js', 'getXMLContent.js')
        ));
        const styleGridViewUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'src', 'css', 'gridView.css')
        ));
        const docString = document.uri.toString();

        const nonce = getNonce();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">

                <title>XML Grid View</title>

                <link href="${styleGridViewUri}" rel="stylesheet">

            </head>

            <body>
                <div id="/" docString="${docString}">
                    click to expand
                </div>

                <script nonce="${nonce}" src="${scriptGetXMLContentUri}"></script>

            </body>
            </html>`;
    }
}