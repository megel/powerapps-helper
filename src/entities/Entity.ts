import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Environment } from './Environment';
import { Solution } from './Solution';

export class Entity extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly entityData: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly command?: vscode.Command
    ) {
        super(`${entityData?.originallocalizedname ?? name}`, collapsibleState);
        
        this.id            = id;
        this.name          = name;
        this.displayName   = entityData?.originallocalizedname ?? name;
        this.entityData    = entityData;
        this.environment   = environment;
        this.entityId      = entityData.entityid;
        this.entitySetName = entityData.entitysetname;
        
        let items = [
            `**${entityData?.displayname ?? name}**\n`,
            `| | | |`,
            `|-:|:-:|:-|`,
            `|*Name:*               ||${this.entityData?.name}|`,
            `|*External Name:*      ||${this.entityData?.externalname ?? '---'}|`,            
            `|*Entity Name:*        ||${this.entityData?.logicalname}|`,
            `|*Entity Set Name:*    ||${this.entityData?.entitysetname}|`,  
            `|*Physical Name:*      ||${this.entityData?.basetablename}|`,
            `|*Physical Name:*      ||${this.entityData?.physicalname}|`,
            `|*Collection Name:*    ||${this.entityData?.collectionname}|`,
            
            `|*Solution-Id:*        ||${this.entityData?.solutionid}|`,
            `|*Entity-Id:*          ||${this.entityData?.entityid}|`,
        ];

        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));
    }

    public readonly entityId: string;
    public readonly entitySetName: string;
    public readonly displayName: string;
    public readonly connectionReferences: any;
    public readonly databaseReferences: any;

    contextValue = 'Entity';

    iconPath = {
		light: path.join(path.dirname(__filename), '..', '..', 'media', 'entity.svg'),
		dark: path.join(path.dirname(__filename), '..', '..', 'media', 'entity.svg')
	};


    static convert (data: any, environment: Environment, solution?: Solution): Entity {
        const connector    = new Entity(
            `${environment.id}/${solution?.solutionData?.solutionid ?? '-'}/${data.solutionid}/${data.name}`,
            data.name,
            data,
            vscode.TreeItemCollapsibleState.None,
            environment
        );
        return connector;
    };

    static sort (p1: Entity, p2: Entity): number {
        return (p1.displayName?.toLowerCase() === p2.displayName?.toLowerCase()) ? 0 : (p1.displayName?.toLowerCase() < p2.displayName?.toLowerCase() ? -1 : 1);
    };
}