// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Utils } from './helpers/Utils';

import { TreeItemWithParent } from './tree/TreeItemWithParent';
import { PowerAppsDataProvider } from './tree/PowerAppsDataProvider';
import { PowerApp } from './entities/PowerApp';
import { Solution } from './entities/Solution';

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
	vscode.commands.registerCommand('mme2k-powerapps-helper.refreshEntry',               () => mme2kPowerAppsProvider.refresh());
	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.pack',              () => Utils.packWorkspacePowerApp());

	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.downloadAndUnpack', (app: PowerApp) => mme2kPowerAppsProvider.downloadAndUnpackApp(app));
	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.openPlayer',        (app: PowerApp) => mme2kPowerAppsProvider.openPlayer(app));
	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.openDesigner',      (app: PowerApp) => mme2kPowerAppsProvider.openDesigner(app));

	vscode.commands.registerCommand('mme2k-powerapps-helper.solution.downloadAndUnpack', (solution: Solution) => mme2kPowerAppsProvider.downloadAndUnpackSolution(solution));
}

export function getTreeViewProvider(): PowerAppsDataProvider {
	return mme2kPowerAppsProvider;
}

export function getTreeView(): vscode.TreeView<TreeItemWithParent> {
	return mme2kPowerAppsTreeView;
}

// this method is called when your extension is deactivated
export function deactivate() {}
