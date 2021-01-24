import * as vscode from 'vscode';

export class TreeItemWithParent extends vscode.TreeItem {

    constructor(public readonly name: string, public readonly collapsibleState: vscode.TreeItemCollapsibleState, public readonly parent?: TreeItemWithParent) {
        super(name, collapsibleState);
    }
}
