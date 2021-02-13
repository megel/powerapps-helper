import * as vscode from 'vscode';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Environment } from './Environment';

import { PowerApp } from './PowerApp';

export class PowerAppVersion extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly version: string,
        public readonly displayName: string,
        public readonly description: string,
        public readonly downloadUrl: string,
        public readonly lifeCycleId: boolean,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly app: PowerApp,
        public readonly command?: vscode.Command
    ) {
        super(displayName, collapsibleState);
        
        this.id          = id;
        this.name        = name;
        this.version     = version;
        this.lifeCycleId = lifeCycleId;
        this.tooltip     = new vscode.MarkdownString(`**${name} *${lifeCycleId}***\n\n*Version:* v${version}\n\n${description}`);
        this.displayName = displayName;
        this.description = description;
        this.downloadUrl = downloadUrl;
        this.app         = app;
    }

    contextValue = 'PowerAppVersion';

    static convert (data: any, powerApp: PowerApp): PowerAppVersion {
        const properties  = data.properties;
        const version     = data.name;
        const downloadUrl = properties.appDefinition.properties.appUris.documentUri.value;
        const appVersion = new PowerAppVersion(
            data.id,
            properties.appDefinition.properties.displayName,
            version, 
            `${version} - ${properties.lifeCycleId}`, 
            properties.appDefinition.properties.description, 
            downloadUrl,
            properties.lifeCycleId, 
            vscode.TreeItemCollapsibleState.None, 
            powerApp,
            undefined);            
        return appVersion;
    };

    static sort (p1: PowerAppVersion, p2: PowerAppVersion): number {
        return (p1?.version?.toLowerCase() === p2?.version?.toLowerCase()) ? 0 : (p1?.version?.toLowerCase() > p2?.version?.toLowerCase() ? -1 : 1);
    };

    static filter (app: PowerAppVersion): boolean {
        return (app.name !== "" && app.name !== undefined);
    };
}