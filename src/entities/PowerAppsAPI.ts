import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { PowerApp } from './PowerApp';
import { Environment } from './Environment';

export class PowerAppsAPI extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly properties: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,        
        public readonly environment: Environment,
        public readonly command?: vscode.Command
    ) {
        super(`${properties.displayName}${properties.connectionParameters?.token?.oAuthSettings ? ' (OAuth)' : ''}`, collapsibleState);
        this.id             = id;
        this.name           = name;
        this.properties     = properties;
        this.environment    = environment;
        this.displayName    = `${properties.displayName}${properties.connectionParameters?.token?.oAuthSettings ? ' (OAuth)' : ''}`;
        
        this.xrmConnectorId = properties.xrmConnectorId;
        this.iconUri        = properties.iconUri;
        this.isCustomApi    = properties.isCustomApi;
        this.oAuthSettings  = properties.connectionParameters?.token?.oAuthSettings;

        this.tooltip     = new vscode.MarkdownString([
            `**${this.displayName}**${ this.xrmConnectorId ? ` *Xrm ConnectorId:* **${this.xrmConnectorId}**`: ''}`,
            `*Connection Parameter${this.oAuthSettings ? ` **OAuth**`: ''}:*`,
            "```json",
            `${JSON.stringify(properties.connectionParameters, undefined, 4)}`,
            "```"
        ].join("\n\n"));
    }

    contextValue = 'PowerAppsAPI';

    public readonly displayName:    string;
    public readonly xrmConnectorId: string;
    public readonly iconUri:        string;
    public readonly isCustomApi:    boolean;
    public readonly oAuthSettings:  any;

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'connector.png'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'connector.png')
	};

    static convert (data: any, environment: Environment): PowerAppsAPI {
        return new PowerAppsAPI(
            data.id,
            data.name,
            data.properties,
            vscode.TreeItemCollapsibleState.None,
            environment);
    };      
    
    static sort (p1: PowerAppsAPI, p2: PowerAppsAPI): number {
        return (p1.displayName.toLowerCase() === p2.displayName.toLowerCase()) ? 0 : (p1.displayName.toLowerCase() < p2.displayName.toLowerCase() ? -1 : 1);
    };
}