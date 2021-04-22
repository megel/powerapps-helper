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
        super(`${properties?.displayName ?? properties?.name} (${ PowerAppsAPI.getSecurityMethod(properties) })`, collapsibleState);
        this.id             = id;
        this.name           = name;
        this.properties     = properties;
        this.environment    = environment;
        this.displayName    = `${properties?.displayName} (${ PowerAppsAPI.getSecurityMethod(properties) })`;
        
        this.xrmConnectorId   = properties?.xrmConnectorId;
        this.iconUri          = properties?.iconUri;
        this.isCustomApi      = properties?.isCustomApi;
        this.oAuthSettings    = properties?.connectionParameters?.token?.oAuthSettings;
        this.apiKeySettings   = properties?.connectionParameters?.api_key;
        this.userPassSettings = properties?.connectionParameters?.username;
        this.security         = PowerAppsAPI?.getSecurityMethod(properties);
        this.contextValue     = ["PowerAppsAPI", this.security].join("-");

        let items = [
            `**${this.displayName}**\n`,
            `| | | |`,
            `|-:|:-:|:-|`,
            (this.xrmConnectorId ? `|*Xrm ConnectorId:* ||${this.xrmConnectorId}|` : undefined),
            `|*Publisher:* ||${this.properties?.publisher}|`,
            `|*Custom API:*||${this.properties?.isCustomApi}|`,
            `|*created:*   ||${this.properties?.createdTime}|`,
            `|*changed:*   ||${this.properties?.changedTime}|`,
        ];

        if (this.oAuthSettings) {
            items.push(
                `|*Authentication:*||***OAuth 2.0***|`,
                `|*Identity Provider:*||${this.oAuthSettings?.identityProvider}`,
                `|*Client-Id:*  ||${this.oAuthSettings?.clientId}|`,
                `|*Tenant-Id:*  ||${this.oAuthSettings?.customParameters?.tenantId?.value}|`,
                `|*Resource-Id:* ||${this.oAuthSettings?.customParameters?.resourceUri?.value}|`);            
        }
        if(this.apiKeySettings) {
            items.push(
                `|*Authentication:*||***API-Key***|`,
                `|*Display-Name:*  ||${this.apiKeySettings?.uiDefinition?.displayName}|`,
                `|*Description:*   ||${this.apiKeySettings?.uiDefinition?.description}|`
            );
        }
        if(this.userPassSettings) {
            items.push(
                `|*Authentication:*||***Basic***|`,
                `|*Display-Name:*  ||${this.userPassSettings?.uiDefinition?.displayName}|`,
                `|*Description:*   ||${this.userPassSettings?.uiDefinition?.description}|`
            );
        }
        if (this.properties?.description) { items.push(`\n---\n${this.properties?.description}`); }

        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));
    }

    static getSecurityMethod(properties: any): string {
        if (properties?.connectionParameters?.token?.oAuthSettings) {
            return "OAuth 2.0";
        } else if (properties?.connectionParameters?.username) {
            return "Basic Authentication";
        } else if (properties?.connectionParameters?.api_key) {
            return "API-Key";
        } else {
            return "no Authentication";
        }
    }

    contextValue = 'PowerAppsAPI';

    public readonly displayName:      string;
    public readonly xrmConnectorId:   string;
    public readonly iconUri:          string;
    public readonly isCustomApi:      boolean;
    public readonly oAuthSettings:    any;
    public readonly apiKeySettings:   any;
    public readonly userPassSettings: any;
    public readonly security:         string;

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