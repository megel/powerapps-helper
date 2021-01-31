import * as vscode from 'vscode';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';

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
}