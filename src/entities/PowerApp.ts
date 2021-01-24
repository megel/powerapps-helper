import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { PowerAppsDataProvider } from '../tree/PowerAppsDataProvider';
import { Settings } from '../helpers/Settings';
import { Utils } from '../helpers/Utils';
import { Connection } from './Connection';
import { strict } from 'assert';
import { utils } from 'mocha';

export class PowerApp extends TreeItemWithParent {

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly version: string,
        public readonly displayName: string,
        public readonly description: string,
        public readonly url: string,
        public readonly downloadUrl: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {        
        super(`${displayName}`, collapsibleState);
        
        this.id          = id;
        this.name        = name;
        this.displayName = displayName;
        this.description = description;
        this.version     = version;
        this.tooltip     = new vscode.MarkdownString(`**${displayName}**\n\n*Version:* v${version}\n\n${description}`);
        this.url         = url;
        this.downloadUrl = downloadUrl;
    }

    contextValue = 'PowerApp';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'powerapps.svg'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'powerapps.svg')
	};
    
    public connections?: Connection[];
    
    public static async getPowerApps(automationDataProvider: PowerAppsDataProvider): Promise<PowerApp[]> {

        const toConnection = (app: PowerApp, k:string, v:any): Connection => new Connection(k,
            v.displayName,
            v.dataSources,
            v.iconUri,
            v.apiTier,
            v.isCustomApiConnection,
            vscode.TreeItemCollapsibleState.Collapsed,
            app);

        const toConnections = (app: PowerApp, connections: any): Connection[] => {
            if (connections === undefined) { return []; }
            
            return Object.entries(connections).map<Connection>(([k, v]) => toConnection(app, k, v));            
        };

        const toPowerApp = (app: any): PowerApp => {
            const properties = app.properties;
            const version    = properties.appPackageDetails !== undefined ? properties.appPackageDetails.documentServerVersion : {};
			const powerApp   = new PowerApp(
                app.id,
                app.name, 
                version !== undefined ? `${version.major}.${version.minor}.${version.build}.${version.revision}` : "", 
                properties.displayName, 
                properties.description, 
                properties.appOpenUri, 
                properties.appUris !== undefined && properties.appUris.documentUri !== undefined ? properties.appUris.documentUri.value : undefined,
                vscode.TreeItemCollapsibleState.Collapsed, 
                undefined);
            powerApp.connections = toConnections(powerApp, properties.connectionReferences);
            return powerApp;
		};

        const sortPowerApps = (p1: PowerApp, p2: PowerApp): number => {
            return (p1.displayName.toLowerCase() === p2.displayName.toLowerCase()) ? 0 : (p1.displayName.toLowerCase() < p2.displayName.toLowerCase() ? -1 : 1);
        };

        const filterPowerApp = (app: PowerApp): boolean => {
            return (app.name !== "" && app.name !== undefined);
        };

        return await Utils.postWithReturnArray<PowerApp>(Settings.getPowerAppsUrl(), toPowerApp, sortPowerApps, filterPowerApp, { }, "application/json");        
	}
    
    public async downloadAndUnpackApp(): Promise<void> {
        await Utils.downloadApp(this);
	}
}