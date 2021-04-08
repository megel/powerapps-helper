// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Utils } from './helpers/Utils';

import { TreeItemWithParent } from './tree/TreeItemWithParent';
import { PowerAppsDataProvider } from './tree/PowerAppsDataProvider';
import { PowerApp } from './entities/PowerApp';
import { Solution } from './entities/Solution';
import { Environment } from '@azure/ms-rest-azure-env';
import { SolutionUtils } from './helpers/SolutionUtils';
import { PowerAppsAPI } from './entities/PowerAppsAPI';
import { CanvasApp } from './entities/CanvasApp';
import { Connector } from './entities/Connector';
import { CloudFlow } from './entities/CloudFlow';
import { stringifyConfiguration } from 'tslint/lib/configuration';
import { OAuthUtils } from './helpers/OAuthUtils';

let mme2kPowerAppsProvider: PowerAppsDataProvider;
let mme2kPowerAppsTreeView: vscode.TreeView<TreeItemWithParent>;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(extensionContext: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mme2k-powerapps-helper" is now active!');

	mme2kPowerAppsProvider = new PowerAppsDataProvider(vscode.workspace.rootPath);
	mme2kPowerAppsTreeView = vscode.window.createTreeView('mme2kPowerApps', {
		treeDataProvider: mme2kPowerAppsProvider
	});

	// Add Commands	
	vscode.commands.registerCommand('mme2k-powerapps-helper.refreshEntry',               async () => await mme2kPowerAppsProvider.refresh());
	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.pack',              async () => await SolutionUtils.packWorkspacePowerApp());

	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.downloadAndUnpack', async (app: PowerApp) => await mme2kPowerAppsProvider.downloadAndUnpackApp(app));
	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.openPlayer',        async (app: PowerApp) => await mme2kPowerAppsProvider.openPlayer(app));
	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.openDesigner',      async (app: PowerApp) => await mme2kPowerAppsProvider.openDesigner(app));

	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp-api.update-oauth',  async (api: PowerAppsAPI) => await mme2kPowerAppsProvider.updateOAuth(api));
	
	vscode.commands.registerCommand('mme2k-powerapps-helper.publish.customizations',     async (item: Solution | CanvasApp | Connector | CloudFlow) => await mme2kPowerAppsProvider.publishCustomizations(item));

	vscode.commands.registerCommand('mme2k-powerapps-helper.solution.downloadAndUnpack', async (solution: Solution) => await mme2kPowerAppsProvider.downloadAndUnpackSolution(solution));
	vscode.commands.registerCommand('mme2k-powerapps-helper.solution.pack',              async (solution: Solution) => await mme2kPowerAppsProvider.packSolution(solution));
	vscode.commands.registerCommand('mme2k-powerapps-helper.solution.packAndUpload',     async (item: any)          => await mme2kPowerAppsProvider.packAndUploadSolution((item as Solution)?.environment || (item as Environment)));

	vscode.commands.registerCommand('mme2k-powerapps-helper.clearCredentialCache',       async () => { await Utils.clearCredentialCache(); });
	
	vscode.commands.registerCommand('mme2k-powerapps-helper.checkSourceFileUtility',     async () => { if(await Utils.checkSourceFileUtility()) {vscode.window.showInformationMessage(`The Power Apps Source File Pack and Unpack Utility was found.`);}; });
}

export function getTreeViewProvider(): PowerAppsDataProvider {
	return mme2kPowerAppsProvider;
}

export function getTreeView(): vscode.TreeView<TreeItemWithParent> {
	return mme2kPowerAppsTreeView;
}

// this method is called when your extension is deactivated
export function deactivate() {}
