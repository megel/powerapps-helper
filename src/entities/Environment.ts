import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { PowerAppsDataProvider } from '../tree/PowerAppsDataProvider';
import { Utils } from '../helpers/Utils';
import { Solution } from './Solution';
import { APIUtils } from '../helpers/APIUtils';

export class Environment extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly location: string,
        public readonly properties: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(`${properties.displayName} [${properties?.environmentSku}${Environment.getExpirationTime(properties)} | ${location}]`, collapsibleState);
        
        this.id          = id;
        this.name        = name;
        this.displayName = `${properties.displayName} (${location})`;
        this.location    = location;
        this.properties  = properties;
        this.tenantId    = properties.createdBy.tenantId;
        this.environmentSku = properties.environmentSku;
        this.instanceApiUrl = properties.linkedEnvironmentMetadata !== undefined ? properties.linkedEnvironmentMetadata.instanceApiUrl : undefined;

        if (properties.environmentSku === "Teams") {
            this.iconPath = {
                light: path.join(path.dirname(__filename), '..', '..', 'media', 'teams.svg'),
                dark: path.join(path.dirname(__filename), '..', '..', 'media', 'teams.svg')
            };
        }
        let links = [
            `[Power Apps](${ `https://make.preview.powerapps.com/environments/${name}/apps` })`,
            `[Flows](${ `https://make.powerautomate.com/environments/${name}/flows` })`,
            `[Connectors](${ `https://make.preview.powerapps.com/environments/${name}/customconnectors` })`,
            `[Connections](${ `https://make.preview.powerapps.com/environments/${name}/connections` })`,
            `[Solutions](${ `https://make.preview.powerapps.com/environments/${name}/solutions` })`,
            `[Tables](${ `https://make.preview.powerapps.com/environments/${name}/entities` })`,
            `[Choices](${ `https://make.preview.powerapps.com/environments/${name}/databases/todonamespace/enumerations` })`,
        ].filter(item => item).join(", ");

        let items = [
            `**${properties.displayName}**\n`,
            links,	
            `| | | |`,
            `|-:|:-:|:-|`,
            `|*Name:*         ||${name}|`,
            `|*Tenant-Id:*    ||${properties?.createdBy?.tenantId}|`,
            `|*Location:*     ||${location}|`,
            `|*Azure-Region:* ||${properties?.azureRegionHint}|`,
            `|*SKU:*          ||${properties?.environmentSku}|`, // **
            `|*Version:*      ||${properties?.linkedEnvironmentMetadata?.version}|`,
            `|*Unique-Name:*  ||${properties?.linkedEnvironmentMetadata?.uniqueName}|`,
            `|*Status:*       ||${properties?.linkedEnvironmentMetadata?.instanceState}|`,
            `|*Platform-SKU:* ||${properties?.linkedEnvironmentMetadata?.platformSku}|`,
            `|*created:*      ||${this.properties?.createdTime}|`,
            `|*Api-URL:*      ||${properties?.linkedEnvironmentMetadata?.instanceApiUrl}|`,
            `|*URL:*          ||${properties?.linkedEnvironmentMetadata?.instanceUrl}|`,
            `|*Admin-URL:*    ||${properties?.clientUris?.admin}|`,
            `|*Maker-URL:*    ||${properties?.clientUris?.maker}|`,            
        ];
        if (this.properties?.description) { items.push(`\n---\n${this.properties?.description}`); }

        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));
    }

    public readonly instanceApiUrl: string;
    public readonly tenantId: string;
    public readonly displayName: string;
    public readonly environmentSku: string;

    contextValue = 'Environment';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'dataverse.svg'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'dataverse.svg')
	};

    public static getExpirationTime(properties: any): string
    {
        if (properties.expirationTime === undefined) { return ''; }

        let d1 : Date= new Date();
        let d2 : Date= new Date(`${properties.expirationTime}`);
        let diff = d2.getTime() - d1.getTime();
        return ` ${Math.floor(diff / 1000 / 60 / 60 / 24)} days remaining`;
    }

    
    private _solutions : Array<Solution> = new Array<Solution>();

    public get solutions() : Array<Solution> {
        return this._solutions;
    }
    
    public set solutions(v : Array<Solution>) {
        this._solutions = v || new Array<Solution>();
    }
    
    /** 
     * get the Environments from API
     */
    public static async getEnvironments(): Promise<Environment[]> {

        const filterEnvironments = (env: Environment): boolean => {
            return (env.name !== "" && env.name !== undefined);
        };

        return await APIUtils.getEnvironments(Environment.convert, Environment.sort, filterEnvironments);
	}

    static convert (data: any): Environment {
            
        const properties  = data.properties;
            const environment = new Environment(
                data.id,
                data.name,
                data.location,
                properties,
                vscode.TreeItemCollapsibleState.Collapsed, 
                undefined);
            return environment;
    };

    static sort (p1: Environment, p2: Environment): number {
        return (p1.properties.displayName.toLowerCase() === p2.properties.displayName.toLowerCase()) ? 0 : (p1.properties.displayName.toLowerCase() < p2.properties.displayName.toLowerCase() ? -1 : 1);
    };
}