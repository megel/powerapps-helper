import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from '../helpers/Utils';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Environment } from './Environment';
import { Solution } from './Solution';

export class CloudFlow extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly cloudFlowData: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly command?: vscode.Command
    ) {
        super(`${cloudFlowData?.displayname ?? name}`, collapsibleState);
        
        this.id            = id;
        this.name          = name;
        this.cloudFlowData = cloudFlowData;
        this.environment   = environment;
        this.uniqueName    = cloudFlowData.uniquename;
        this.isManaged     = cloudFlowData.ismanaged;
        this.clientdata    = JSON.parse(cloudFlowData.clientdata ?? "{}");

        let items = [
            `**${cloudFlowData?.displayname ?? name}**\n`,
            `| | | |`,
            `|-:|:-:|:-|`,
            `|*Name:*        ||${this.cloudFlowData?.name}|`,
            `|*Solution-Id:* ||${this.cloudFlowData?.solutionid}|`,
            `|*Workflow-Id:* ||${this.cloudFlowData?.workflowid}|`,
            `|*Workflow-Unique-Id:* ||${this.cloudFlowData?.workflowidunique}|`,
            `|*created:*   ||${this.cloudFlowData?.createdon}|`,
            `|*changed:*   ||${this.cloudFlowData?.modifiedon}|`,
        ];

        if (this.cloudFlowData?.description) { items.push(`\n---\n${this.cloudFlowData?.description}`); }

        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));
    }

    public readonly uniqueName: string;
    public readonly isManaged: boolean;
    public readonly  clientdata: any;
    
    contextValue = 'CloudFlow';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'powerautomate.svg'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'powerautomate.svg')
	};


    static convert (data: any, environment: Environment, solution?: Solution): CloudFlow {            
        const cloudFlow    = new CloudFlow(
        `${environment.id}/${solution?.solutionData?.solutionid ?? '-'}/${data.solutionid}/${data.workflowidunique}`,
        data.name,
        data,
        vscode.TreeItemCollapsibleState.None,
        environment);
        return cloudFlow;
    };

    static sort (p1: CloudFlow, p2: CloudFlow): number {
        return (p1.name.toLowerCase() === p2.name.toLowerCase()) ? 0 : (p1.name.toLowerCase() < p2.name.toLowerCase() ? -1 : 1);
    };
}