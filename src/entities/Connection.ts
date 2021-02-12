import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { PowerApp } from './PowerApp';

export class Connection extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly dataSources: string[],
        public readonly iconUri: string,
        public readonly apiTier: string,
        public readonly isCustomApiConnection: boolean,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly app: PowerApp,
        public readonly command?: vscode.Command
    ) {
        super(`${name} (${apiTier})`, collapsibleState);
        
        this.id          = id;
        this.name        = name;
        this.dataSources = dataSources;
        this.isCustomApiConnection     = isCustomApiConnection;
        this.tooltip     = (dataSources || []).join(", ");
        this.iconUri     = iconUri;
        this.apiTier     = apiTier;
    }

    contextValue = 'Connection';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'connection.png'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'connection.png')
	};
}