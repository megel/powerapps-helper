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
    }

    public readonly canvasappid: string;
    public readonly isManaged: boolean;
    public readonly displayname: string;

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