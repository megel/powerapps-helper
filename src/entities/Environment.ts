import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { PowerAppsDataProvider } from '../tree/PowerAppsDataProvider';
import { Utils } from '../helpers/Utils';

export class Environment extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly location: string,
        public readonly properties: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(`${properties.displayName} (${location})`, collapsibleState);
        
        this.id          = id;
        this.name        = name;
        this.location    = location;
        this.properties  = properties;
        this.tenantId    = properties.createdBy.tenantId;
        this.instanceApiUrl = properties.linkedEnvironmentMetadata !== undefined ? properties.linkedEnvironmentMetadata.instanceApiUrl : undefined;
    }

    public readonly instanceApiUrl: string;
    public readonly tenantId: string;

    contextValue = 'Environment';

    
    /** 
     * get the Environments from API
     */
    public static async getEnvironments(): Promise<Environment[]> {

        const toEnvironment = (env: any): Environment => {
            const properties  = env.properties;
            const environment = new Environment(
                env.id,
                env.name,
                env.location,
                properties,
                vscode.TreeItemCollapsibleState.Collapsed, 
                undefined);
            return environment;
		};

        const sortEnvironments = (e1: Environment, e2: Environment): number => {
            return (e1.properties.displayName.toLowerCase() === e2.properties.displayName.toLowerCase()) ? 0 : (e1.properties.displayName.toLowerCase() < e2.properties.displayName.toLowerCase() ? -1 : 1);
        };

        const filterEnvironments = (env: Environment): boolean => {
            return (env.name !== "" && env.name !== undefined);
        };

        return await Utils.getEnvironments(toEnvironment, sortEnvironments, filterEnvironments);
	}
}