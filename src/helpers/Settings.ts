import * as vscode from 'vscode';

export class Settings {
    
    private static sourceFileUtilityDefault: string = 'PASopa.exe';

    static sourceFileUtility(): string {
        let def: string | undefined = vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('SourceFileUtility');
        if (def === undefined || def === '') {
            def = this.sourceFileUtilityDefault;
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
}