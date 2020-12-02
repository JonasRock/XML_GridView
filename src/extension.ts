import * as vscode from 'vscode';
import { GridViewEditorProvider } from './gridViewEditor';
import * as net from 'net';
import * as path from 'path';
import * as child_process from 'child_process';

let socket: net.Socket;
let server: net.Server;

export function activate(context: vscode.ExtensionContext)
{
	context.subscriptions.push(GridViewEditorProvider.register(context));
	let xmlServerPath: string = path.join(__dirname, "../XML_GridViewServer.exe");
	return createServer(context, xmlServerPath);
}

function createServer(context: vscode.ExtensionContext, serverPath: string) {
	let exec: child_process.ChildProcess;
	return new Promise<child_process.ChildProcess>(resolve => {
		server = net.createServer(s => {
			console.log("Connection established");
			socket = s;
			socket.setNoDelay(true);
			socket.on("end", (hadError: boolean) => {
				console.log("Connection ended");
			});
			server.close();
			resolve(exec);
		});
		server.listen(0, '127.0.0.1', () => {
			var portNr: Number = ((server.address() as any).port);
			console.log("Listening on Port " + portNr);
			//exec = child_process.spawn(serverPath, [portNr.toString()]);
		});
	});
}