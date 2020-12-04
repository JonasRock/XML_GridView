import { JSONRPCClient, JSONRPCServer, JSONRPCServerAndClient } from "json-rpc-2.0";
import * as net from 'net';
import * as vscode from "vscode";
import { MessageBuffer } from "./messageBuffer";

export class CommunicationHandler {

    private serverAndClient: JSONRPCServerAndClient;

    constructor(
        private socket: net.Socket,
        private webviewPanel: vscode.WebviewPanel,
        private document: vscode.TextDocument
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
            switch (message.method) {
                //Depending on the method, here we can append additional info to the request that the webview has no access to
                case "init": message.params = {"uri": document.uri.toString()};
            }
            this.serverAndClient.request(message.method, message.params)
                .then((result => {
                    if (message.id) {
                        webviewPanel.webview.postMessage({"result": result, "id": message.id });
                    }
                    else {
                        console.error("Webview request missing ID parameter");
                    }
                }));
        });

        //tell the webview that the server is ready
        webviewPanel.webview.postMessage({"id":0, "result": null});
    }
}