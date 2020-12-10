import * as vscode from 'vscode';

export class Config {

    private _arxml: boolean = false;
    public get arxml(): boolean {
        return this._arxml;
    }
    public getNewConfiguration(): void {
        let settings: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('xml-grid-view');
        let autosarMode: boolean | undefined = settings.get("autosarMode");
        if (autosarMode) {
            this._arxml = true;
        } else {
            this._arxml = false;
        }
    }
}