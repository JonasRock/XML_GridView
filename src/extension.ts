import * as vscode from 'vscode';
import { GridViewEditorProvider } from './gridViewEditor';

export function activate(context: vscode.ExtensionContext)
{
	context.subscriptions.push(GridViewEditorProvider.register(context));
}