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
import { APIUtils } from '../helpers/APIUtils';
import { SolutionUtils } from '../helpers/SolutionUtils';
import { PowerAppsAPI } from '../entities/PowerAppsAPI';
import { CloudFlow } from '../entities/CloudFlow';
import { Connector } from '../entities/Connector';
import { CanvasApp } from '../entities/CanvasApp';
import { OAuthUtils } from '../helpers/OAuthUtils';
import { LabelBelowEntity } from './LabelBelowEntity';

export class PowerAppsDataProvider implements vscode.TreeDataProvider<TreeItemWithParent> {
	
	private _onDidChangeTreeData: vscode.EventEmitter<TreeItemWithParent | undefined> = new vscode.EventEmitter<TreeItemWithParent | undefined>();
	readonly onDidChangeTreeData: vscode.Event<TreeItemWithParent | undefined> = this._onDidChangeTreeData.event;

	static readonly labelSolutions:  	      string = "Solutions (Dataverse)";

	static readonly labelEntitiesDataverse:         string = "Entities (Dataverse)";
	static readonly labelTablesDataverse:          	string = "Tables (Dataverse)";
	static readonly labelModelDrivenAppsDataverse: 	string = "Model Driven Apps (Dataverse)";
	static readonly labelCanvasAppsDataverse: 		string = "Canvas Apps (Dataverse)";
	static readonly labelFlowsDataverse:      		string = "Flows (Dataverse)";
	static readonly labelConnectorsDataverse: 		string = "Connectors (Dataverse)";

	static readonly labelEntities:            string = "Entities";
	static readonly labelModelDrivenApps:     string = "Model Driven Apps";
	static readonly labelCanvasApps: 		  string = "Canvas Apps";
	static readonly labelFlows:      	 	  string = "Flows";
	static readonly labelConnectors: 		  string = "Connectors";

	constructor(private workspaceRoot: string | undefined) {
	}

	refresh(): void {
		OAuthUtils.reset();
		this.cachedEnvironments = [];
		this.cachedPowerApps    = [];		
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
		
		if (element.contextValue === 'labelBelowEnvironment' && element.label === PowerAppsDataProvider.labelSolutions) {
			return await (element as LabelBelowEnvironment).getSolutions() || [];
		} else if (element.contextValue === 'labelBelowEnvironment' && element.label === PowerAppsDataProvider.labelCanvasAppsDataverse) {
			return await (element as LabelBelowEnvironment).getCanvasApps() || [];
		} else if (element.contextValue === 'labelBelowEnvironment' && element.label === PowerAppsDataProvider.labelModelDrivenAppsDataverse) {
			return await (element as LabelBelowEnvironment).getModelDrivenApps() || [];
		} else if (element.contextValue === 'labelBelowEnvironment' && element.label === PowerAppsDataProvider.labelFlowsDataverse) {
			return await (element as LabelBelowEnvironment).getCloudFlows() || [];
		} else if (element.contextValue === 'labelBelowEnvironment' && element.label === PowerAppsDataProvider.labelConnectorsDataverse) {
			return await (element as LabelBelowEnvironment).getConnectors() || [];
		} else if (element.contextValue === 'labelBelowEnvironment' && element.label === 'Power Apps') {
			return await (element as LabelBelowEnvironment).getPowerApps() || [];
		} else if (element.contextValue === 'labelBelowEnvironment' && element.label === 'Custom APIs') {
			return await (element as LabelBelowEnvironment).getPowerAppsAPIs() || [];
		} else if (element.contextValue === 'labelBelowSolution' && element.label === PowerAppsDataProvider.labelEntities) {
			return await (element as LabelBelowSolution).getEntities() || [];
		} else if (element.contextValue === 'labelBelowSolution' && element.label === PowerAppsDataProvider.labelCanvasApps) {
			return await (element as LabelBelowSolution).getCanvasApps() || [];
		} else if (element.contextValue === 'labelBelowSolution' && element.label === PowerAppsDataProvider.labelModelDrivenApps) {
			return await (element as LabelBelowSolution).getModelDrivenApps() || [];
		} else if (element.contextValue === 'labelBelowSolution' && element.label === PowerAppsDataProvider.labelFlows) {
			return await (element as LabelBelowSolution).getCloudFlows() || [];
		} else if (element.contextValue === 'labelBelowSolution' && element.label === PowerAppsDataProvider.labelConnectors) {
			return await (element as LabelBelowSolution).getConnectors() || [];
		} else if (element.contextValue === 'labelBelowEntity' && element.label === 'Columns') {
			return await (element as LabelBelowEntity).getColumns() || [];
		} else if (element.contextValue === 'labelBelowPowerApp' && element.label === 'Connections') {
			return (element as LabelBelowPowerApp).app.connections || [];
		} else if (element.contextValue === 'labelBelowPowerApp' && element.label === 'Versions') {
			return await (element as LabelBelowPowerApp).app.getVersions() || [];
		} else if (element.contextValue === 'PowerApp') { 
			return [
				new LabelBelowPowerApp('Versions',    vscode.TreeItemCollapsibleState.Collapsed, element),
				new LabelBelowPowerApp('Connections', vscode.TreeItemCollapsibleState.Collapsed, element)
			];
		} else if (element.contextValue === 'Entity') { 
			return [
				new LabelBelowEntity('Columns', vscode.TreeItemCollapsibleState.Collapsed, element),
				new LabelBelowEntity('Views',   vscode.TreeItemCollapsibleState.Collapsed, element),
				new LabelBelowEntity('Forms',   vscode.TreeItemCollapsibleState.Collapsed, element)
			];
		} else if (element.contextValue === 'Environment') { 
			return [
				//new LabelBelowEnvironment(PowerAppsDataProvider.labelEntitis,    				vscode.TreeItemCollapsibleState.Collapsed, element, this),
				new LabelBelowEnvironment(PowerAppsDataProvider.labelSolutions,  				vscode.TreeItemCollapsibleState.Collapsed, element, this),
				new LabelBelowEnvironment(PowerAppsDataProvider.labelModelDrivenAppsDataverse,	vscode.TreeItemCollapsibleState.Collapsed, element, this),
				new LabelBelowEnvironment(PowerAppsDataProvider.labelCanvasAppsDataverse, 		vscode.TreeItemCollapsibleState.Collapsed, element, this),
				new LabelBelowEnvironment(PowerAppsDataProvider.labelFlowsDataverse,      		vscode.TreeItemCollapsibleState.Collapsed, element, this),
				new LabelBelowEnvironment(PowerAppsDataProvider.labelConnectorsDataverse, 		vscode.TreeItemCollapsibleState.Collapsed, element, this),
				new LabelBelowEnvironment('Power Apps',  vscode.TreeItemCollapsibleState.Collapsed, element, this),
				new LabelBelowEnvironment('Custom APIs', vscode.TreeItemCollapsibleState.Collapsed, element, this),
			];
		} else if (element.contextValue === 'Solution') { 
			var nodes: any[] = 
			[
				new LabelBelowSolution(PowerAppsDataProvider.labelEntities,      	vscode.TreeItemCollapsibleState.Collapsed, element, this),
				new LabelBelowSolution(PowerAppsDataProvider.labelCanvasApps, 		vscode.TreeItemCollapsibleState.Collapsed, element, this),
			];
			if (element?.environment?.environmentSku !== "Teams") {
				nodes.push(
					new LabelBelowSolution(PowerAppsDataProvider.labelModelDrivenApps, 	vscode.TreeItemCollapsibleState.Collapsed, element, this)
				);
			}
			nodes.push(
				new LabelBelowSolution(PowerAppsDataProvider.labelFlows,      		vscode.TreeItemCollapsibleState.Collapsed, element, this),
				new LabelBelowSolution(PowerAppsDataProvider.labelConnectors, 		vscode.TreeItemCollapsibleState.Collapsed, element, this),				
			);
			return nodes;
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
			await APIUtils.downloadAndUnpackPowerApp(app);
		}
	}

	/**
	 * Download a Solution and extract to source folder.
	 * @param solution (optional)
	 */	
	public async downloadAndUnpackSolution(solution?: Solution | undefined): Promise<void> {
		if (! solution) {
			const environment = await this.selectEnvironment();
			if (environment === undefined) { return; }
			solution = solution || await this.selectSolution(environment);
		}
		
		if (solution !== undefined) {
			let item = await vscode.window.showQuickPick([
				{label: `All`,      description: `Publish All solution customizations (recommended)`, result: 'all', default: true},
				{label: `Solution`, description: `Publish solution customizations`,                   result: 'solution'},
				{label: `No`,       description: `Download and unpack solution 'as-is'`,              result: 'no'}
			]) as any;
			if (! item?.result) { return; }
			if (item?.result === 'all') {
				await APIUtils.publishAllCustomizations(solution.environment);
			} else if (item?.result === 'solution') {
				const parameterXml = await SolutionUtils.getPublishParameter(solution);
				if (parameterXml) {
					await APIUtils.publishCustomizations(solution.environment, parameterXml);
				};
			}
			await APIUtils.downloadAndUnpackSolution(solution);
		}
	}
	
	/**
	 * Package the local solution
	 * @param solution (optional)
	 */	
	 public async packSolution(solution?: Solution | undefined): Promise<void> {
		await APIUtils.packWorkspaceSolution(true);
	}

	/**
		 * Package and upload the local solution
		 * @param solution (optional)
		 */	
	public async packAndUploadSolution(environment?: Environment | undefined): Promise<void> {
		environment = environment || await this.selectEnvironment();

		if (environment) { await APIUtils.packWorkspaceSolution(false, environment); }
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
	 * Select a PowerApp
	 */
	async selectPowerApp() : Promise<PowerApp | undefined> {
		
		var environment = await this.selectEnvironment();
		if (! environment) { return; }

		if (this.cachedPowerApps === undefined) {
			const environments = this.cachedEnvironments || (this.cachedEnvironments = (await Environment.getEnvironments()));
        	this.cachedPowerApps = await APIUtils.getPowerApps((data) => PowerApp.convert(data, environments), PowerApp.sort, (app:PowerApp) => app.environment === environment && PowerApp.filter(app));
		}
		
		if (this.cachedPowerApps === undefined || this.cachedPowerApps.length === 0) {
			vscode.window.showWarningMessage(`No PowerApps found. Please check your configuration.`);
			return;
		}

		let workspaceAppId = await SolutionUtils.getWorkspaceAppId();
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

	/**
	 * Update the OAuth2 settings of a custom connector.
	 * @param api to update.
	 */
	public async updateOAuth(target: PowerAppsAPI | Solution): Promise<void> {
		if (! target) {

			var environment = await this.selectEnvironment();
			if (!environment) { return; }
			
			var api = await this.selectPowerAppsAPI(environment);
			if (!api) { return; }
			target = api;
		}

		if (target instanceof Solution) { await APIUtils.updateOAuthForSolution(target.environment, target?.solutionData?.solutionid); }
		if (target instanceof PowerAppsAPI) { await APIUtils.batchUpdateOAuth([target]); }
	}

	/**
	 * Publish all Xml customizations.
	 * @param environment to update.
	 */
	public async publishCustomizations(item: Solution | CanvasApp | Connector | CloudFlow): Promise<void> {
		if (! item) {
			return;
		}

		await APIUtils.publishAllCustomizations(item.environment);
	}
	
	/**
	 * Select an environment
	 */
	 async selectEnvironment() : Promise<Environment | undefined> {
		
		if (this.cachedEnvironments === undefined) {
			this.cachedEnvironments = await APIUtils.getEnvironments(Environment.convert, Environment.sort);
		}
		
		if (this.cachedEnvironments === undefined || this.cachedEnvironments.length === 0) {
			vscode.window.showWarningMessage(`No Environments found. Please check your configuration.`);
			return;
		}

		let items: vscode.QuickPickItem[] = this.cachedEnvironments.map(app => {
			return {
				description: `${false ? '(workspace)' : ''}`,
				detail:      `${app.description || ''}`,
				label:       `${app.displayName}`,				
				app:         app,
				isDefault:   false
			};
		}).sort((app1, app2) => app1.isDefault ? -1 : (app1.label < app2.label ? -1 : 1) );
		
		let item = await vscode.window.showQuickPick(items);
		if (item !== undefined) {
			return <Environment>((<any>item).app);
		}
	}

	/**
	 * Select a solution
	 */
	 async selectSolution(environment: Environment) : Promise<Solution | undefined> {
		
		if (environment.solutions === undefined || environment.solutions.length <= 0) {
			const convert = (data: any): Solution => Solution.convert(environment, data);
			environment.solutions = await APIUtils.getSolutions(environment.instanceApiUrl, convert, Solution.sort, undefined, undefined);
		}
		
		if (environment.solutions === undefined || (environment?.solutions?.length || 0) <= 0) {
			vscode.window.showWarningMessage(`No solutions found in environment ${environment?.displayName || '---'}.`);
			return;
		}

		var localSolutions = await SolutionUtils.getWorkspaceSolutions();
		let items: vscode.QuickPickItem[] = environment.solutions.map(item => {
			return {
				description: `${localSolutions.find(s => item.uniqueName === s?.uniqueName) ? '(workspace)' : ''}`,
				detail:      `${item.description || ''}`,
				label:       `${item.displayName}`,				
				solution:    item,
				isDefault:   localSolutions.find(s => item.uniqueName === s?.uniqueName)
			};
		}).sort((s1, s2) => {
			if (s1.isDefault && ! s2.isDefault) {return -1;}
			if (! s1.isDefault && s2.isDefault) {return  1;}

			return (s1.label < s2.label ? -1 : 1);
		});
		
		let item = await vscode.window.showQuickPick(items);
		if (item !== undefined) {
			return <Solution>((<any>item).solution);
		}
	}

	/**
	 * Select a PowerAppsAPI from environment
	 */
	 async selectPowerAppsAPI(environment: Environment) : Promise<PowerAppsAPI | undefined> {
		const convert = (data: any): PowerAppsAPI => PowerAppsAPI.convert(data, environment);
		const apis    = await APIUtils.getPowerAppsAPIs(environment, convert, PowerAppsAPI.sort, (api) => api.isCustomApi, undefined);
		
		if (apis === undefined || (apis?.length || 0) <= 0) {
			vscode.window.showWarningMessage(`No APIs found in environment ${environment?.displayName || '---'}.`);
			return;
		}

		let items: vscode.QuickPickItem[] = apis.map(api => {
			return {
				description: `${false ? '(workspace)' : ''}`,
				detail:      `${api.description || ''}`,
				label:       `${api.displayName}`,				
				api:         api,
				isDefault:   false
			};
		}).sort((app1, app2) => app1.isDefault ? -1 : (app1.label < app2.label ? -1 : 1) );
		
		let item = await vscode.window.showQuickPick(items);
		if (item !== undefined) {
			return <PowerAppsAPI>((<any>item).api);
		}
	}
}
