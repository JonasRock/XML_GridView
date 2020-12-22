import { JSONRPCClient, JSONRPCServer, JSONRPCServerAndClient } from "json-rpc-2.0";
import * as net from 'net';
import * as vscode from "vscode";
import { Config } from "./config";
import { MessageBuffer } from "./messageBuffer";

export class CommunicationHandler {

    private serverAndClient: JSONRPCServerAndClient;
    private config: Config;
    private webviews: Map<string, vscode.WebviewPanel>;
    private receiveBuffer: MessageBuffer;

    constructor(
        private socket: net.Socket,
    ) {
        this.webviews = new Map<string, vscode.WebviewPanel>();
        this.serverAndClient = new JSONRPCServerAndClient(
            new JSONRPCServer,
            new JSONRPCClient(
                request => {
                    try {
                        this.socket.write(JSON.stringify(request) + "\r\n\r\n");
                        return Promise.resolve();
                    }
                    catch (error) {
                        return Promise.reject(error);
                    }
                }
            )
        );
        socket.on("close", () => { this.serverAndClient.rejectAllPendingRequests("Connection is closed"); });
        this.config = new Config;
        this.config.getNewConfiguration();
        vscode.workspace.onDidChangeConfiguration(() => this.config.getNewConfiguration());
        
        this.receiveBuffer = new MessageBuffer("\r\n\r\n");
        //Message from the XML server
        socket.on("data", this.onSocketData.bind(this));
    }
    private onSocketData(data: Buffer)
    {
        this.receiveBuffer.push(data.toString());
        while(!this.receiveBuffer.isFinished()) {
            const message = this.receiveBuffer.getMessage();
            this.serverAndClient.receiveAndSend(JSON.parse(message));
        }
    }

    public updateSocket(socket: net.Socket)
    {
        this.socket = socket;
        this.socket.on("data", this.onSocketData.bind(this));
        this.serverAndClient = new JSONRPCServerAndClient(
            new JSONRPCServer,
            new JSONRPCClient(
                request => {
                    try {
                        this.socket.write(JSON.stringify(request) + "\r\n\r\n");
                        return Promise.resolve();
                    }
                    catch (error) {
                        return Promise.reject(error);
                    }
                }
            )
        );
    }

    public addWebview(docUri: string, webviewPanel: vscode.WebviewPanel) {
        this.webviews.set(docUri, webviewPanel);
        this.init(webviewPanel);
    }

    private goToElement(params: any) {
        this.serverAndClient.request("getNodePosition", params).then(result => {
            editorGoTo(new vscode.Location(vscode.Uri.parse(params.uri),
                new vscode.Position(result.line, result.character))
            );
        });
    }

    private onWebviewMessage(webviewPanel: vscode.WebviewPanel, message: any) {
        var toXMLServer: boolean = true;
        switch(message.method) {
            case "goto": this.goToElement(message.params); toXMLServer = false; break;
            case "getChildren": message.params["options"] = {"arxml": this.config.arxml}; break;
            case "showNotification": toXMLServer = false; vscode.window.showWarningMessage(
                message.params.text, "Go to Error", "Ignore").then(
                    value => {
                        if(value !== "Ignore") {
                            editorGoTo(
                                new vscode.Location(vscode.Uri.parse(message.params.uri),
                                new vscode.Position(message.params.position.line, message.params.position.character))
                            );
                        }
                });
                break;
        }
        if (toXMLServer) {
            this.serverAndClient.request(message.method, message.params)
            .then((result => {
                if (message.id) {
                    webviewPanel.webview.postMessage({"result": result, "id": message.id });
                }
                else {
                    console.error("Webview request missing ID parameter");
                }
            }), reason => {
                console.log(reason);
            });
        }
    }

    private init(webviewPanel: vscode.WebviewPanel) {
        webviewPanel.webview.onDidReceiveMessage(message => {
            this.onWebviewMessage(webviewPanel, message);
        });
        webviewPanel.webview.postMessage({"id": 0, "result": null});
    }
}




function editorGoTo(loc: vscode.Location | vscode.Range, callback?: Function) {
	if ('uri' in loc) {
		vscode.window.showTextDocument(loc.uri)
		.then(function (document) {
			if (vscode.window.activeTextEditor) {
				let sel = new vscode.Selection(loc.range.start.line, loc.range.start.character, loc.range.end.line, loc.range.end.character);
					vscode.window.activeTextEditor.selection = sel;
					vscode.window.activeTextEditor.revealRange(new vscode.Selection(sel.start, sel.end), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
					if (callback) {
						callback();
					}
				}
			});
		} else {
			if (vscode.window.activeTextEditor) {
			let sel = new vscode.Selection(loc.start.line, loc.start.character, loc.end.line, loc.end.character);
			vscode.window.activeTextEditor.selection = sel;
			vscode.window.activeTextEditor.revealRange(new vscode.Selection(sel.start, sel.end), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
		}
	}
}