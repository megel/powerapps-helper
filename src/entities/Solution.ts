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
        super(`${name}`, collapsibleState);
        
        this.id           = id;
        this.name         = name;
        this.displayName  = name;
        this.solutionData = solutionData;
        this.environment  = environment;
        this.uniqueName   = solutionData.uniquename;
        this.isManaged    = solutionData.ismanaged;
    }

    public readonly uniqueName: string;
    public readonly isManaged: boolean;
    public readonly displayName: string;
    
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