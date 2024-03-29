import * as vscode from 'vscode';
import { Utils } from './Utils';

export class Settings {
    
    private static coreToolsSolutionPackagerDefault: string = 'SolutionPackager.exe';

    static powerPlatformCli(): string {
        let def: string | undefined = vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('PowerPlatformCli');
        if (def === undefined || def === '') {
            def = Utils.cliExePath;
        }
        return `${def}`;
    }

    static sourceFolder(): string {
        let def: string | undefined = vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('SourceFolder');
        if (def === undefined || def === '') {
            def = "src";
        }
        return `${def}`;
    }

    static outputFolder(): string {
        let def: string | undefined = vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('OutputFolder');
        if (def === undefined || def === '') {
            def = "out";
        }
        return `${def}`;
    }

    static getMaxVisibleVersions(): number | undefined {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('MaxVisibleVersions') ?? 10;
    }

    static cacheAPIConnectionSecretes(): boolean {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('CacheAPIConnectionSecrets') ?? true;
    }

    static solutionFolderName(): string {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('SolutionFolderName') ?? "";
    }

    static useCrmSolutionPacker(): boolean {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('UseCrmSolutionPacker') ?? true;
    }

    static getAPIConnectionSettings(environmentName: string, authentication: string, apiId: string): any {
        let connectionSettings : any = (vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('APIConnectionSettings') ?? {});
        let env                : any = connectionSettings[environmentName] ?? {};
        return env[`${apiId}.${authentication}`] ?? env[`${authentication}`]?? {};
    }

    static getGraphVisualizationApi(): string {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('GraphVisualizationApi') ?? '';
    }

    static showIdsInLabel(): boolean {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('Graph-ShowIdsInLabel') ?? false;
    }
    
    static useClusteredComponents(): boolean {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('Graph-ClusteredComponents') ?? false;
    }
    
    static fontSizeSolution(): string {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('Graph-FontSizeSolution') ?? '12pt';
    }
    
    static fontSizeComponent(): string {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('Graph-FontSizeComponent') ?? '11pt';
    }
    
    static fontSizeComponentCluster(): string {
        return vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('Graph-FontSizeComponentCluster') ?? '10pt';
    }
}