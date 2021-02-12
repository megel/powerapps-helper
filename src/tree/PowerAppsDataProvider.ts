import * as vscode from 'vscode';
import { PowerApp } from '../entities/PowerApp';
import { Connection } from '../entities/Connection';
import { TreeItemWithParent } from "./TreeItemWithParent";
import { LabelBelowPowerApp } from './LabelBelowPowerApp';
import { LabelBelowEnvironment } from './LabelBelowEnvironment';
import { Utils } from '../helpers/Utils';
import { Environment } from '../entities/Environment';
import { Solution } from '../entities/Solution';
import { LabelBelowSolution } from './LabelBelowSolution';

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

	cachedPowerApps?: PowerApp[];
	cachedEnvironments?: Environment[];

	async getChildren(element?: any): Promise<TreeItemWithParent[]> {
		if (element === undefined) { this.cachedEnvironments = await Environment.getEnvironments(); return this.cachedEnvironments || []; }
		if (element === undefined) { this.cachedPowerApps    = await PowerApp.getPowerApps(); return this.cachedPowerApps || []; }
		
		if (element.contextValue === 'labelBelowEnvironment' && element.label === 'Solutions') {
			return await (element as LabelBelowEnvironment).getSolutions() || [];
		} else if (element.contextValue === 'labelBelowEnvironment' && element.label === 'Canvas Apps') {
			return await (element as LabelBelowEnvironment).getCanvasApps() || [];
		} else if (element.contextValue === 'labelBelowEnvironment' && element.label === 'Flows') {
			return await (element as LabelBelowEnvironment).getCloudFlows() || [];
		} else if (element.contextValue === 'labelBelowEnvironment' && element.label === 'Connectors') {
			return await (element as LabelBelowEnvironment).getConnectors() || [];
		} else if (element.contextValue === 'labelBelowSolution' && element.label === 'Canvas Apps') {
			return await (element as LabelBelowSolution).getCanvasApps() || [];
		} else if (element.contextValue === 'labelBelowSolution' && element.label === 'Flows') {
			return await (element as LabelBelowSolution).getCloudFlows() || [];
		} else if (element.contextValue === 'labelBelowSolution' && element.label === 'Connectors') {
			return await (element as LabelBelowSolution).getConnectors() || [];
		} else if (element.contextValue === 'labelBelowPowerApp' && element.label === 'Connections') {
			return (element as LabelBelowPowerApp).app.connections || [];
		} else if (element.contextValue === 'labelBelowPowerApp' && element.label === 'Versions') {
			return await (element as LabelBelowPowerApp).app.getVersions() || [];
		} else if (element.contextValue === 'PowerApp') { 
			return [
				new LabelBelowPowerApp('Versions', vscode.TreeItemCollapsibleState.Collapsed, element),
				new LabelBelowPowerApp('Connections', vscode.TreeItemCollapsibleState.Collapsed, element)
			];
		} else if (element.contextValue === 'Environment') { 
			return [
				new LabelBelowEnvironment('Solutions',   vscode.TreeItemCollapsibleState.Collapsed, element),
				new LabelBelowEnvironment('Canvas Apps', vscode.TreeItemCollapsibleState.Collapsed, element),
				new LabelBelowEnvironment('Flows',       vscode.TreeItemCollapsibleState.Collapsed, element),
				new LabelBelowEnvironment('Connectors',  vscode.TreeItemCollapsibleState.Collapsed, element),
			];
		} else if (element.contextValue === 'Solution') { 
			return [
				new LabelBelowSolution('Canvas Apps', vscode.TreeItemCollapsibleState.Collapsed, element),
				new LabelBelowSolution('Flows',       vscode.TreeItemCollapsibleState.Collapsed, element),
				new LabelBelowSolution('Connectors',  vscode.TreeItemCollapsibleState.Collapsed, element),				
			];
		} else {
			return [];
		}

    }

	/**
	 * Download a PowerApp msapp package and extract the package
	 * @param app (optional) PowerApp.
	 */	
	public async downloadAndUnpackApp(app?: PowerApp | undefined): Promise<void> {
        app = app || await this.selectPowerApp();
		if (app !== undefined) {
			await Utils.downloadAndUnpackPowerApp(app);
		}
	}

	/**
	 * Download a PowerApp msapp package and extract the package
	 * @param solution (optional) PowerApp.
	 */	
	public async downloadAndUnpackSolution(solution?: Solution | undefined): Promise<void> {
		solution = solution ;// TODO: || await this.selectSolution();
		if (solution !== undefined) {
			await Utils.downloadAndUnpackSolution(solution);
		}
	}

    /**
	 * Open the PowerApp designer with the app or an PowerApp from a quick pick list.
	 * @param app (optional) PowerApp.
	 */	
	public async openDesigner(app?: PowerApp | undefined): Promise<void> {
		app = app || await this.selectPowerApp();
		if (app !== undefined) {
			vscode.env.openExternal(vscode.Uri.parse(`https://create.powerapps.com/studio/#source=portal&environment-name=${app.environment}&action=edit&app-id=${encodeURI(app.id)}&environment-update-cadence=Frequent`));
		}
    }

    /**
	 * Open the PowerApp player with the app or an PowerApp from a quick pick list.
	 * @param app (optional) PowerApp
	 */
	public async openPlayer(app?: PowerApp | undefined): Promise<void> {
        app = app || await this.selectPowerApp();
		if (app !== undefined) {
			vscode.env.openExternal(vscode.Uri.parse(`${app.url}`));
		}
	}

	/**
	 * Select a PowerApp from cached list
	 */
	async selectPowerApp() : Promise<PowerApp | undefined> {
		
		if (this.cachedPowerApps === undefined) {
			this.cachedPowerApps = await PowerApp.getPowerApps();
		}
		
		if (this.cachedPowerApps === undefined || this.cachedPowerApps.length === 0) {
			vscode.window.showWarningMessage(`No PowerApps found. Please check your configuration.`);
			return;
		}

		let workspaceAppId = await Utils.getWorkspaceAppId();
		let items: vscode.QuickPickItem[] = this.cachedPowerApps.map(app => {
			return {
				description: `${workspaceAppId === app.id ? '(workspace)' : ''}`,
				detail:      `${app.description || ''}`,
				label:       `${app.displayName}`,				
				app:         app,
				isDefault:   workspaceAppId === app.id
			};
		}).sort((app1, app2) => app1.isDefault ? -1 : (app1.label < app2.label ? -1 : 1) );
		
		let item = await vscode.window.showQuickPick(items);
		if (item !== undefined) {
			return <PowerApp>((<any>item).app);
		}
	}
}