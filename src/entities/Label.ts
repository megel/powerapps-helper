import { TreeItemWithParent } from "../tree/TreeItemWithParent";
import { PowerApp } from "../entities/PowerApp";
import * as vscode from 'vscode';

export class LabelBelowPowerApp extends TreeItemWithParent {

    constructor(
        public readonly name: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly app: PowerApp,
        public readonly command?: vscode.Command
    ) {
        super(name, collapsibleState, app);
    }    

    contextValue = 'labelBelowPowerApp';

}