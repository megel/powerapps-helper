import * as vscode from 'vscode';
import { PowerApp } from '../entities/PowerApp';
import { Connection } from '../entities/Connection';
import { TreeItemWithParent } from "./TreeItemWithParent";
import { LabelBelowPowerApp } from '../entities/Label';

export class PowerAppsDataProvider implements vscode.TreeDataProvider<TreeItemWithParent> {

	private _onDidChangeTreeData: vscode.EventEmitter<TreeItemWithParent | undefined> = new vscode.EventEmitter<TreeItemWithParent | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TreeItemWithParent | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	refreshTreeItem(tiwp: TreeItemWithParent): void {
		this._onDidChangeTreeData.fire(tiwp);
	}

	getTreeItem(element: PowerApp): TreeItemWithParent {
		return element;
	}

	async getChildren(element?: any): Promise<TreeItemWithParent[]> {
		if (element === undefined) { return await PowerApp.getPowerApps(this); }

		if (element.contextValue === 'labelBelowPowerApp' && element.label === 'Connections') {
			return (element as LabelBelowPowerApp).app.connections || [];

		} else if (element.contextValue === 'PowerApp') { 
			return [
				new LabelBelowPowerApp('Connections', vscode.TreeItemCollapsibleState.Collapsed, element)
			];
		} else {
			return [];
		}
    }
}