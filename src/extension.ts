import * as vscode from 'vscode';
import { GridViewEditorProvider } from './gridViewEditor';
import * as net from 'net';
import * as path from 'path';
import * as child_process from 'child_process';
import { CommunicationHandler } from './communicationHandler';
import * as os from 'os';

let exec: child_process.ChildProcess;
let socket: net.Socket;
let server: net.Server;
var commHandler: CommunicationHandler | undefined;

export function activate(context: vscode.ExtensionContext)
{
	commHandler = undefined;
	start(context);
	
}
function start(context: vscode.ExtensionContext) {
	
	let xmlServerPath: string;
	if (os.platform() === "win32") {
		xmlServerPath = path.join(__dirname, "../XML_GridViewServer_Windows.exe");
	} else {
		xmlServerPath = path.join(__dirname, "../XML_GridViewServer_Linux");
	}
	context.subscriptions.push(vscode.commands.registerCommand("xml-grid-view.restartGridView", () => {
		stop();
		for (const subscription of context.subscriptions) {
			try {
				subscription.dispose();
			} catch (e) {
				console.error(e);
			}
		}
		start(context);
	}));
	createXMLServer(context, xmlServerPath)
	.then( () => {
		if(!commHandler) {
			commHandler = new CommunicationHandler(socket);
		} else {
			commHandler.updateSocket(socket);
		}
		context.subscriptions.push(GridViewEditorProvider.register(context, commHandler));
	});
}


function stop() {
	socket.end();
	server.close();
	exec.kill();
}

export function deactivate() {
	stop();
}

function createXMLServer(context: vscode.ExtensionContext, serverPath: string) {
	return new Promise<child_process.ChildProcess>(resolve => {
		server = net.createServer(s => {
			console.log("Connection established");
			socket = s;
			socket.setNoDelay(true);
			socket.setEncoding('utf8');
			socket.on("close", (hadError: boolean) => {
				console.log("Connection ended");
			});
			server.close();
			resolve(exec);
		});
		server.listen(0, '127.0.0.1', () => {
			var portNr: Number = ((server.address() as any).port);
			console.log("Listening on Port " + portNr);
			exec = child_process.spawn(serverPath, [portNr.toString()]);
		});
	});
}