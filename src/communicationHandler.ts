import { JSONRPCClient, JSONRPCServer, JSONRPCServerAndClient } from "json-rpc-2.0";
import * as net from 'net';
import * as vscode from "vscode";
import { Config } from "./config";
import { MessageBuffer } from "./messageBuffer";

export class CommunicationHandler {

    private serverAndClient: JSONRPCServerAndClient;
    private config: Config;

    constructor(
        private socket: net.Socket,
        private webviewPanel: vscode.WebviewPanel,
    ) {
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

        //Message from the XML server
        let received = new MessageBuffer("\r\n\r\n");
        socket.on("data", (data) => {
            received.push(data.toString());
            while (!received.isFinished()) {
                const message = received.getMessage();
                this.serverAndClient.receiveAndSend(JSON.parse(message));
            }
        });

        //Requests from the Webview
        webviewPanel.webview.onDidReceiveMessage((message) => {
            let extern: boolean = true;
            switch (message.method) {
                //Depending on the method, here we can append additional info to the request that the webview has no access to
            case "getChildren": message.params["options"] = {"arxml": this.config.arxml}; break;
                case "showNotification": extern = false; vscode.window.showWarningMessage(message.params.text, "Go to Error", "Ignore")
                    .then(value => {
                        if (value !== "Ignore") {
                            editorGoTo(
                                new vscode.Location(vscode.Uri.parse(message.params.uri),
                                    new vscode.Position(message.params.position.line, message.params.position.character))
                            );
                        }
                    });
                break;
            }
            if(extern) {
                this.serverAndClient.request(message.method, message.params)
                .then((result => {
                    if (message.id) {
                        webviewPanel.webview.postMessage({"result": result, "id": message.id });
                    }
                    else {
                        console.error("Webview request missing ID parameter");
                    }
                }));
            }
        });

        //tell the webview that the server is ready
        webviewPanel.webview.postMessage({"id":0, "result": null});
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