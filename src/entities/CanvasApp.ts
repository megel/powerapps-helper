import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from '../helpers/Utils';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Environment } from './Environment';
import { Solution } from './Solution';

export class CanvasApp extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly canvasAppData: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly command?: vscode.Command
    ) {
        super(`${canvasAppData?.displayname ?? name}`, collapsibleState);
        
        this.id            = id;
        this.name          = name;
        this.displayname   = canvasAppData?.displayname ?? name;
        this.canvasAppData = canvasAppData;
        this.environment   = environment;
        this.canvasappid   = canvasAppData.canvasappid;
        this.isManaged     = canvasAppData.ismanaged;
        this.connectionReferences = JSON.parse(canvasAppData?.connectionreferences ?? "{}");
        this.databaseReferences   = JSON.parse(canvasAppData?.databasereferences ?? "{}");
        let items = [
            `**${canvasAppData?.displayname ?? name}**\n`,
            `| | | |`,
            `|-:|:-:|:-|`,
            `|*Name:*               ||${this.canvasAppData?.name}|`,
            `|*App-Version:*        ||${this.canvasAppData?.appversion}|`,
            `|*Version Number:*     ||${this.canvasAppData?.versionnumber}|`,  
            `|*Designer-Version:*   ||${this.canvasAppData?.createdbyclientversion}|`,
            `|*Solution-Id:*        ||${this.canvasAppData?.solutionid}|`,
            `|*CanvasApp-Id:*       ||${this.canvasAppData?.canvasappid}|`,
            `|*Workflow-Unique-Id:* ||${this.canvasAppData?.workflowidunique}|`,
            `|*created:*            ||${this.canvasAppData?.createdtime}|`,
            `|*last modified:*      ||${this.canvasAppData?.lastmodifiedtime}|`,
            `|*last published:*     ||${this.canvasAppData?.lastpublishtime}|`,
            `|*Status:*             ||${this.canvasAppData?.status}|`,
            //`|*Connection-References:* ||${this.canvasAppData?.status}|`,
        ];
        if (this.databaseReferences["default.cds"]?.dataSources) {
            items.push(`|***Database-References***||${Object.keys(this.databaseReferences["default.cds"].dataSources).length}|`);
            Object.keys(this.databaseReferences["default.cds"].dataSources).forEach(k => items.push(`|*${this.databaseReferences["default.cds"].dataSources[k]?.entitySetName}*||${k}|`));
        }

        if (this.canvasAppData?.description) { items.push(`\n---\n${this.canvasAppData?.description}`); }

        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));
    }

    public readonly canvasappid: string;
    public readonly isManaged: boolean;
    public readonly displayname: string;
    public readonly connectionReferences: any;
    public readonly databaseReferences: any;

    contextValue = 'CanvasApp';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'powerapps.svg'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'powerapps.svg')
	};


    static convert (data: any, environment: Environment, solution?: Solution): CanvasApp {
        const connector    = new CanvasApp(
            `${environment.id}/${solution?.solutionData?.solutionid ?? '-'}/${data.solutionid}/${data.name}`,
            data.name,
            data,
            vscode.TreeItemCollapsibleState.None,
            environment
        );
        return connector;
    };

    static sort (p1: CanvasApp, p2: CanvasApp): number {
        return (p1.displayname.toLowerCase() === p2.displayname.toLowerCase()) ? 0 : (p1.displayname.toLowerCase() < p2.displayname.toLowerCase() ? -1 : 1);
    };
}