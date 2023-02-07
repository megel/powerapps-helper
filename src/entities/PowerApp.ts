import * as vscode from 'vscode';
import * as path from 'path';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Settings } from '../helpers/Settings';
import { Utils } from '../helpers/Utils';
import { Connection } from './Connection';
import { PowerAppVersion } from './PowerAppVersion';
import { Environment } from './Environment';
import { env } from 'process';
import { APIUtils } from '../helpers/APIUtils';

export class PowerApp extends TreeItemWithParent {

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly version: string,
        public readonly displayName: string,
        public readonly description: string,
        public readonly url: string,
        public readonly designerUrl: string,
        public readonly downloadUrl: string,
        public readonly properties: any,
        public readonly environment: Environment | undefined,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(`${displayName}`, collapsibleState);

        this.id          = id;
        this.name        = name;
        this.displayName = displayName;
        this.description = description;
        this.version     = version;
        this.url         = url;
        this.designerUrl = designerUrl;
        this.downloadUrl = downloadUrl;
        this.environment = environment;
        this.properties  = properties;

        //this.tooltip     = new vscode.MarkdownString(`**${displayName}**\n\n*Version:* v${version}\n\n${description}`);
        let items = [
            `**${displayName ?? name}**\n`,
            `| | | |`,
            `|-:|:-:|:-|`,
            `|*Name:*               ||${name}|`,
            `|*App-Version:*        ||${version}|`,
            `|*App Plan Classification:*||${this.properties?.appPlanClassification}|`,
            `|*Designer-Version:*   ||${this.properties?.createdByClientVersion?.major}.${this.properties?.createdByClientVersion?.minor}.${this.properties?.createdByClientVersion?.build}.${this.properties?.createdByClientVersion?.revision}|`,
            `|*CanvasApp-Id:*       ||${id?.split("/")?.slice(-1)[0]}|`,  // unauthenticatedWebPackageHint
            `|*Id:*                 ||${id}|`,
            `|*created:*            ||${this.properties?.createdTime}|`,
            `|*last modified:*      ||${this.properties?.lastModifiedTime}|`,
            `|*last published:*     ||${this.properties?.lastPublishTime}|`,
            `|*Status:*             ||${this.properties?.status}|`,
            `|*Download:*           ||[msapp-file](${downloadUrl})|`,
            `|*Open Player:*        ||[Player-URL](${url})|`,
            `|*Open Designer:*      ||[Designer-URL](${designerUrl})|`,
        ];

        if (this.properties?.connectionReferences) {
            items.push(`|***Connection-References***||${Object.keys(this.properties?.connectionReferences).length}|`);
            Object.keys(properties?.connectionReferences).forEach(k => items.push(`|*${this.properties?.connectionReferences[k]?.displayName}*||${this.properties?.connectionReferences[k]?.apiTier}|`));
        }

        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));

    }

    contextValue = 'PowerApp';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'powerapps.svg'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'powerapps.svg')
	};

    public connections?: Connection[];

    static convert (data: any, environments?: Environment[]): PowerApp {
        const properties    = data.properties;
        const version       = properties.appPackageDetails !== undefined ? properties.appPackageDetails.documentServerVersion : {};
        const toConnections = (app: PowerApp, connections: any): Connection[] => { return connections === undefined ? [] : Object.entries(connections).map<Connection>(([k, v]) => Connection.convert(app, k, v)); };
        const environment   = environments?.filter(e => e.id.toLowerCase() === properties.environment.id.toLowerCase())[0];
        const powerApp      = new PowerApp(
            data.id,
            data.name,
            version !== undefined ? `${version.major}.${version.minor}.${version.build}.${version.revision}` : "",
            properties.displayName,
            properties.description,
            `${properties.appOpenUri}&hidenavbar=true`,
            `https://make.preview.powerapps.com/e/${environment?.name}/canvas/?action=edit&app-id=${encodeURI(data.id)}`,            
            properties.appUris !== undefined && properties.appUris.documentUri !== undefined ? properties.appUris.documentUri.value : undefined,
            properties,
            environment,
            vscode.TreeItemCollapsibleState.Collapsed,
            undefined);

        powerApp.connections = toConnections(powerApp, properties.connectionReferences);
        return powerApp;
    };

    static sort (p1: PowerApp, p2: PowerApp): number {
        return (p1?.displayName?.toLowerCase() === p2?.displayName?.toLowerCase()) ? 0 : (p1?.displayName?.toLowerCase() < p2?.displayName?.toLowerCase() ? -1 : 1);
    };

    static filter (app: PowerApp): boolean {
        return (app.name !== "" && app.name !== undefined);
    };


    /**
     * Get all PowerApp versions
     */
    public async getVersions(): Promise<PowerAppVersion[]> {
        const versions = await APIUtils.getPowerAppVersions(this.name, (data: any) => PowerAppVersion.convert(data, this), PowerAppVersion.sort, PowerAppVersion.filter);
        return versions.slice(0, Settings.getMaxVisibleVersions());
	}
}