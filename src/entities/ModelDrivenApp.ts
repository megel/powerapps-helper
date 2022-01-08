import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Environment } from './Environment';
import { Solution } from './Solution';

export class ModelDrivenApp extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly appData: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly command?: vscode.Command
    ) {
        super(`${appData?.name}`, collapsibleState);
        
        this.id            = id;
        this.name          = name;
        this.displayName   = appData?.name ?? name;
        this.appData       = appData;
        this.environment   = environment;
        this.appModuleId   = appData.appmoduleid;
        this.isManaged     = appData.ismanaged;
        this.connectionReferences = JSON.parse(appData?.connectionreferences ?? "{}");
        this.databaseReferences   = JSON.parse(appData?.databasereferences ?? "{}");
        let items = [
            `**${appData?.displayname ?? name}**\n`,
            `| | | |`,
            `|-:|:-:|:-|`,
            `|*Name:*                  ||${this.appData?.name}|`,
            `|*Version Number:*        ||${this.appData?.versionnumber}|`,  
            `|*Solution-Id:*           ||${this.appData?.solutionid}|`,
            `|*AppModule-Id:*          ||${this.appData?.appmoduleid}|`,
            `|*AppModule-Unique-Name:* ||${this.appData?.uniquename}|`,
            `|*created:*               ||${this.appData?.createdon}|`,
            `|*last modified:*         ||${this.appData?.modifiedon}|`,
            `|*last published:*        ||${this.appData?.publishedon}|`,
            `|*Status:*                ||${this.appData?.statuscode}|`,
            //`|*Connection-References:* ||${this.canvasAppData?.status}|`,
        ];
        // if (this.databaseReferences["default.cds"]?.dataSources) {
        //     items.push(`|***Database-References***||${Object.keys(this.databaseReferences["default.cds"].dataSources).length}|`);
        //     Object.keys(this.databaseReferences["default.cds"].dataSources).forEach(k => items.push(`|*${this.databaseReferences["default.cds"].dataSources[k]?.entitySetName}*||${k}|`));
        // }

        if (this.appData?.description) { items.push(`\n---\n${this.appData?.description}`); }

        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));
    }

    public readonly appModuleId: string;
    public readonly isManaged: boolean;
    public readonly displayName: string;
    public readonly connectionReferences: any;
    public readonly databaseReferences: any;

    contextValue = 'ModelDrivenApp';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'modeldrivenapp.svg'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'modeldrivenapp.svg')
	};


    static convert (data: any, environment: Environment, solution?: Solution): ModelDrivenApp {
        const connector    = new ModelDrivenApp(
            `${environment.id}/${solution?.solutionData?.solutionid ?? '-'}/${data.solutionid}/${data.name}`,
            data.name,
            data,
            vscode.TreeItemCollapsibleState.None,
            environment
        );
        return connector;
    };

    static sort (p1: ModelDrivenApp, p2: ModelDrivenApp): number {
        return (p1.displayName.toLowerCase() === p2.displayName.toLowerCase()) ? 0 : (p1.displayName.toLowerCase() < p2.displayName.toLowerCase() ? -1 : 1);
    };
}