import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from '../helpers/Utils';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Environment } from './Environment';
import { PowerAppsAPI } from './PowerAppsAPI';
import { Solution } from './Solution';

export class Connector extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly connectorData: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly command?: vscode.Command
    ) {
        super(`${name}`, collapsibleState);
        
        this.id            = id;
        this.name          = name;
        this.connectorData = connectorData;
        this.environment   = environment;
        this.uniqueName    = connectorData.uniquename;
        this.isManaged     = connectorData.ismanaged;
        
        this.connectionParameters = JSON.parse(connectorData?.connectionparameters ?? "{}");
        this.oAuthSettings        = this.connectionParameters?.token?.oAuthSettings;
        this.apiKeySettings       = this.connectionParameters?.api_key;
        this.userPassSettings     = this.connectionParameters?.username;
        this.security             = Connector.getSecurityMethod(this.connectionParameters);

        let items = [
            `**${this.name}**\n`,
            `| | | |`,
            `|-:|:-:|:-|`,
            `|*Name:*        ||${this.connectorData?.name}|`,
            `|*Solution-Id:* ||${this.connectorData?.solutionid}|`,
            `|*Connector-Id:*   ||${this.connectorData?.connectorid}|`,
            `|*Custom API:*  ||${this.connectorData?.connectoridunique}|`,
            `|*created on:*  ||${this.connectorData?.createdon}|`,
            `|*changed on:*  ||${this.connectorData?.modifiedon}|`,
        ];

        if (this.oAuthSettings) {
            items.push(
                `|*Authentication:*||***OAuth 2.0***|`,
                `|*Identity Provider:*||${this.oAuthSettings?.identityProvider}`,
                `|*Client-Id:*  ||${this.oAuthSettings?.clientId}|`,
                `|*Tenant-Id:*  ||${this.oAuthSettings?.customParameters?.tenantId?.value}|`,
                `|*Resource-Id:*||${this.oAuthSettings?.customParameters?.resourceUri?.value}|`);            
        }
        if(this.apiKeySettings) {
            items.push(
                `|*Authentication:*||***API-Key***|`,
                `|*Display-Name:*  |${this.apiKeySettings?.uiDefinition?.displayName}|`,
                `|*Description:*  |${this.apiKeySettings?.uiDefinition?.description}|`
            );
        }
        if(this.userPassSettings) {
            items.push(
                `|*Authentication:*||***Basic***|`,
                `|Display-Name:  |${this.userPassSettings?.uiDefinition?.displayName}|`,
                `|Description:  |${this.userPassSettings?.uiDefinition?.description}|`
            );
        }
        if (this.connectorData?.description) { items.push(`\n---\n${this.connectorData?.description}`); }

        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));
    }

    public readonly uniqueName:       string;
    public readonly isManaged:        boolean;
    public readonly connectionParameters: any;
    public readonly oAuthSettings:    any;
    public readonly apiKeySettings:   any;
    public readonly userPassSettings: any;
    public readonly security:         string;

    static getSecurityMethod(connectionParameters: any): string {
        if (connectionParameters?.token?.oauthSettings) {
            return "OAuth 2.0";
        } else if (connectionParameters?.username) {
            return "Basic Authentication";
        } else if (connectionParameters?.api_key) {
            return "API-Key";
        } else {
            return "no Authentication";
        }
    }

    contextValue = 'Connector';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'connector.png'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'connector.png')
	};


    static convert (data: any, environment: Environment, solution?: Solution): Connector {
        const connector    = new Connector(
            `${environment.id}/${solution?.solutionData?.solutionid ?? '-'}/${data.solutionid}/${data.name}`,
            data.description || data.name || "",
            data,
            vscode.TreeItemCollapsibleState.None,
            environment
        );
        return connector;
    };

    static sort (p1: Connector, p2: Connector): number {
        return (p1.name.toLowerCase() === p2.name.toLowerCase()) ? 0 : (p1.name.toLowerCase() < p2.name.toLowerCase() ? -1 : 1);
    };
}