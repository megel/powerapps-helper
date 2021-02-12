import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from '../helpers/Utils';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Environment } from './Environment';
import { Solution } from './Solution';

export class Connector extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly connectorData: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly command?: vscode.Command
    ) {
        super(`${name}`, collapsibleState);
        
        this.id            = id;
        this.name          = name;
        this.connectorData = connectorData;
        this.environment   = environment;
        this.uniqueName    = connectorData.uniquename;
        this.isManaged     = connectorData.ismanaged;
    }

    public readonly uniqueName: string;
    public readonly isManaged: boolean;

    contextValue = 'Connector';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'connector.png'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'connector.png')
	};


    static convert (data: any, environment: Environment, solution?: Solution): Connector {
        const connector    = new Connector(
            `${environment.id}/${solution?.solutionData?.solutionid ?? '-'}/${data.solutionid}/${data.name}`,
            data.description || data.name || "",
            data,
            vscode.TreeItemCollapsibleState.None,
            environment
        );
        return connector;
    };

    static sort (p1: Connector, p2: Connector): number {
        return (p1.name.toLowerCase() === p2.name.toLowerCase()) ? 0 : (p1.name.toLowerCase() < p2.name.toLowerCase() ? -1 : 1);
    };
}