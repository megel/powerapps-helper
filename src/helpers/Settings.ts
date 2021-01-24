import * as vscode from 'vscode';

export class Settings {

    private static getPowerAppUrlDefault:    string = '';
    private static getPowerAppsUrlDefault:   string = '';
    private static sourceFileUtilityDefault: string = 'PASopa.exe';

    static getPowerAppUrl(): string {
        let def: string | undefined = vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('GetPowerAppUrl');
        if (def === undefined || def === '') {
                def = this.getPowerAppUrlDefault;
        }
        return `${def}`;
    }

    static getPowerAppsUrl(): string {
        let def: string | undefined = vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('GetPowerAppsUrl');
        if (def === undefined || def === '') {
                def = this.getPowerAppsUrlDefault;
        }
        return `${def}`;
    }

    static sourceFileUtility(): string {
        let def: string | undefined = vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('SourceFileUtility');
        if (def === undefined || def === '') {
            def = this.sourceFileUtilityDefault;
        }
        return `${def}`;
    }

    static targetFolder(): string {
        let def: string | undefined = vscode.workspace.getConfiguration('mme2k-powerapps-helper').get('TargetFolder');
        if (def === undefined || def === '') {
            def = "src";
        }
        return `${def}`;
    }
}