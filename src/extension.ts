// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Utils } from './helpers/Utils';

import { TreeItemWithParent } from './tree/TreeItemWithParent';
import { PowerAppsDataProvider } from './tree/PowerAppsDataProvider';
import { PowerApp } from './entities/PowerApp';
import { Solution } from './entities/Solution';
import { Environment } from './entities/Environment';
import { SolutionUtils } from './helpers/SolutionUtils';
import { PowerAppsAPI } from './entities/PowerAppsAPI';
import { CanvasApp } from './entities/CanvasApp';
import { Connector } from './entities/Connector';
import { CloudFlow } from './entities/CloudFlow';
import { ITelemetry } from './telemetry/ITelemetry';
import { v4 } from 'uuid';
import { createTelemetryReporter } from './telemetry/configuration';
import { AI_KEY, EXTENSION_NAME } from './constants';
import TelemetryReporter from 'vscode-extension-telemetry';
import { IPacInterop, IPacWrapperContext, PacInterop, PacWrapper, PacWrapperContext } from './pac/PacWrapper';
import { DependencyViewProvider } from './panels/DependencyViewPanel';

const path = require('path');

let mme2kPowerAppsProvider: PowerAppsDataProvider;
let mme2kPowerAppsTreeView: vscode.TreeView<TreeItemWithParent>;
let mme2kPowerAppsOutputChannel: vscode.OutputChannel;
let _context: vscode.ExtensionContext;
let _telemetry: TelemetryReporter;
let _pacContext: IPacWrapperContext;
let _pacInterop: IPacInterop;
let _pacWrapper: PacWrapper;
let _cliPath: string;

export function extensionPath(): string { return _context.extensionPath; }
export function globalStorageLocalPath(): string { return _context.globalStorageUri.fsPath; }
export function pacPacToolsPath(): string { return `${globalStorageLocalPath().replace("megel.mme2k-powerapps-helper", "microsoft-isvexptools.powerplatform-vscode")}/microsoft-isvexptools.powerplatform-vscode/pac/tools/`; }

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(extensionContext: vscode.ExtensionContext): Promise<void> {
	_context = extensionContext;

	// setup telemetry
    const sessionId = v4();
    _telemetry = createTelemetryReporter(EXTENSION_NAME, _context, AI_KEY, sessionId);
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mme2k-powerapps-helper" is now active!');
	mme2kPowerAppsOutputChannel = vscode.window.createOutputChannel('Power Apps Helper');
	mme2kPowerAppsOutputChannel.show(true);
	mme2kPowerAppsOutputChannel.appendLine(`Power Apps Helper started`);

	// Store the PAC Information from Microsoft
	_pacContext = new PacWrapperContext(_context, _telemetry);
	_pacInterop = new PacInterop(_pacContext);
	_pacWrapper = new PacWrapper(_pacContext, _pacInterop);
	_cliPath    = path.resolve(_context.globalStorageUri.fsPath.replace("megel.mme2k-powerapps-helper", "microsoft-isvexptools.powerplatform-vscode"), 'pac');
	Utils.register(_pacContext, _pacInterop, _pacWrapper, _cliPath, pacPacToolsPath());
	// https://code.visualstudio.com/api/references/vscode-api#EnvironmentVariableCollection
	_context.environmentVariableCollection.prepend('PATH', _cliPath + path.delimiter);

	mme2kPowerAppsProvider = new PowerAppsDataProvider(vscode.workspace.rootPath);
	mme2kPowerAppsTreeView = vscode.window.createTreeView('mme2kPowerApps', {
		treeDataProvider: mme2kPowerAppsProvider
	});

	// Register Dependency Viewer
	if (vscode.window.registerWebviewPanelSerializer) {
		vscode.window.registerWebviewPanelSerializer(DependencyViewProvider.viewType, {
		  async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
			webviewPanel.webview.options = DependencyViewProvider.getWebviewOptions(extensionContext.extensionUri);
			DependencyViewProvider.revive(webviewPanel, extensionContext.extensionUri);
		  }
		});
	}
	
	// Add Commands	
	vscode.commands.registerCommand('mme2k-powerapps-helper.refreshEntry',               async () => await mme2kPowerAppsProvider.refresh());
	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.pack',              async () => await SolutionUtils.packWorkspacePowerApp());

	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.downloadAndUnpack', async (app: PowerApp) => await mme2kPowerAppsProvider.downloadAndUnpackApp(app));
	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.openPlayer',        async (app: PowerApp) => await mme2kPowerAppsProvider.openPlayer(app));
	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp.openDesigner',      async (app: PowerApp) => await mme2kPowerAppsProvider.openDesigner(app));

	vscode.commands.registerCommand('mme2k-powerapps-helper.powerapp-api.update-oauth',  async (target: PowerAppsAPI | Solution) => await mme2kPowerAppsProvider.updateOAuth(target));
	
	vscode.commands.registerCommand('mme2k-powerapps-helper.publish.customizations',     async (item: Solution | CanvasApp | Connector | CloudFlow) => await mme2kPowerAppsProvider.publishCustomizations(item));

	vscode.commands.registerCommand('mme2k-powerapps-helper.visualizeDependencies', 	 async (item: any) => await mme2kPowerAppsProvider.visualizeDependencies(extensionContext, (item as Environment)?.solutions || [item as Solution]));
	vscode.commands.registerCommand('mme2k-powerapps-helper.solution.downloadAndUnpack', async (solution: Solution) => await mme2kPowerAppsProvider.downloadAndUnpackSolution(solution));
	vscode.commands.registerCommand('mme2k-powerapps-helper.solution.pack',              async (solution: Solution) => await mme2kPowerAppsProvider.packSolution(solution));
	vscode.commands.registerCommand('mme2k-powerapps-helper.solution.packAndUpload',     async (item: any)          => await mme2kPowerAppsProvider.packAndUploadSolution((item as Solution)?.environment || (item as Environment)));

	vscode.commands.registerCommand('mme2k-powerapps-helper.clearCredentialCache',       async () => { await Utils.clearCredentialCache(); });
	
	vscode.commands.registerCommand('mme2k-powerapps-helper.checkPowerPlatformCli',      async () => { if(await Utils.checkPowerPlatformCli()) {vscode.window.showInformationMessage(`The Power Apps Cli was found.`);}; });
}

export function getOutputChannel(): vscode.OutputChannel {
	return mme2kPowerAppsOutputChannel;
}

export function outputHttpLog(text?: string) {
	getOutputChannel().append((text ?? "") + " ... ");
}
export function outputHttpResult(response: any) {
	getOutputChannel().append(response ? `HTTP/1.1 ${response?.status} ${response?.statusText}\n` : "No Response\n");
}

export function getTreeViewProvider(): PowerAppsDataProvider {
	return mme2kPowerAppsProvider;
}

export function getTreeView(): vscode.TreeView<TreeItemWithParent> {
	return mme2kPowerAppsTreeView;
}

// this method is called when your extension is deactivated
export function deactivate() {}


export interface ICliAcquisitionContext {
    readonly extensionPath: string;
    readonly globalStorageLocalPath: string;
    readonly telemetry: ITelemetry;
    showInformationMessage(message: string, ...items: string[]): void;
    showErrorMessage(message: string, ...items: string[]): void;
}
class CliAcquisitionContext implements ICliAcquisitionContext {
    public constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly _telemetry: ITelemetry) {
    }

    public get extensionPath(): string { return this._context.extensionPath; }
    public get globalStorageLocalPath(): string { return this._context.globalStorageUri.fsPath; }
    public get telemetry(): ITelemetry { return this._telemetry; }

    showInformationMessage(message: string, ...items: string[]): void {
        vscode.window.showInformationMessage(message, ...items);
    }
    showErrorMessage(message: string, ...items: string[]): void {
        vscode.window.showErrorMessage(message, ...items);
    }
}