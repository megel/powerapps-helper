import * as path from 'path';
import * as vscode from 'vscode';
import { APIUtils } from '../helpers/APIUtils';
import { SolutionUtils } from '../helpers/SolutionUtils';
import { Utils } from '../helpers/Utils';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Environment } from './Environment';

export class Solution extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly solutionData: any,        
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly command?: vscode.Command
    ) {
        super(`${name} v${solutionData?.version} (${solutionData?.ismanaged ? "managed" : "unmanaged"})`, collapsibleState);
        
        this.id           = id;
        this.name         = name;
        this.displayName  = `${name} v${solutionData?.version} (${solutionData?.ismanaged ? "managed" : "unmanaged"})`;
        this.solutionData = solutionData;
        this.environment  = environment;
        this.uniqueName   = solutionData.uniquename;
        this.isManaged    = solutionData.ismanaged;
        this.publisher    = solutionData.publisherid;

        let items = [
            `**${this.solutionData?.friendlyname}**${ this.displayName ? ` v${this.solutionData?.version}`: ''}\n`,
            `| | | |`,
            `|-:|:-:|:-|`,
            `|*Solution-Id:* ||${this.solutionData?.solutionid}|`,
            `|*Unique-Name:* ||${this.solutionData?.uniquename}|`,
            `|*Version:*     ||${this.solutionData?.version}|`,
            `|*Publisher:*   ||${this.publisher?.friendlyname}|`,
            `|*Publisher-UN:*||${this.publisher?.uniquename}|`,
            `|*installed on:*||${this.solutionData?.installedon}|`,
            `|*managed:*     ||${this.solutionData?.ismanaged}|`,
            `|*managed Api:* ||${this.solutionData?.isapimanaged}|`,
            `\n[Solution Designer](${this.environment?.properties?.clientUris?.maker?.replace(/\/home$/, "")}/solutions/${this.solutionData?.solutionid})`
        ];

        if (this.solutionData?.description) { items.push(`\n---\n${this.solutionData?.description}`); }

        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));
    }

    public readonly uniqueName: string;
    public readonly isManaged: boolean;
    public readonly displayName: string;
    public readonly publisher: any;
    
    /**
     * Get all PowerApp versions
     */
    public async getExportSolution(): Promise<void> {

        await APIUtils.downloadAndUnpackSolution(this);

    }

    contextValue = 'Solution';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'solution.png'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'solution.png')
	};

    static convert (environment: Environment, data: any): Solution {
            
        const solution    = new Solution(
            `${environment.id}/${data.solutionid}`,
            data.friendlyname,
            data,
            vscode.TreeItemCollapsibleState.Collapsed,
            environment);
        return solution;
    };

    static sort (p1: Solution, p2: Solution): number {
        return (p1.displayName?.toLowerCase() === p2.displayName?.toLowerCase()) ? 0 : (p1.displayName?.toLowerCase() < p2.displayName?.toLowerCase() ? -1 : 1);
    };
}