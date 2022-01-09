import * as path from 'path';
import * as vscode from 'vscode';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { Entity } from './Entity';
import { Environment } from './Environment';
import { Solution } from './Solution';

export class EntityColumn extends TreeItemWithParent {
	
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly entityData: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly entity: Entity,
        public readonly command?: vscode.Command
    ) {
        super(`${entityData?.DisplayName?.LocalizedLabels[0]?.Label ?? name} (${entityData?.LogicalName})${entityData?.IsPrimaryId ? ' PRIMARY': ''}`, collapsibleState);
        
        this.id            = id;
        this.name          = name;
        this.displayName   = entityData?.DisplayName?.LocalizedLabels[0]?.Label ?? name;
        this.entityData    = entityData;
        this.environment   = environment;
        this.entityId      = entity.entityId;
        this.entitySetName = entity.entitySetName;
        
        let items = [
            `**${entityData?.DisplayName?.LocalizedLabels[0]?.Label ?? name}**\n`,
            `| | | |`,
            `|-:|:-:|:-|`,
            `|*Logical Name:*        ||${this.entityData?.LogicalName}|`,           
            `|*Schema Name:*         ||${this.entityData?.SchemaName}|`,
            `|*External Name:*       ||${this.entityData?.ExternalName ?? '---'}|`,  
            `|*Is Primary Id:*       ||${this.entityData?.IsPrimaryId}|`,
            `|*Is Logical:*          ||${this.entityData?.IsLogical}|`,
            `|*created:*             ||${this.entityData?.CreatedOn}|`,
            `|*last modified:*       ||${this.entityData?.ModifiedOn}|`,
            
            `|*Attribute Type:*      ||${this.entityData?.AttributeType}|`,
            `|*Attribute Type Name:* ||${this.entityData?.AttributeTypeName?.Vale}|`,
            
            `|*Metadata-Id:*         ||${this.entityData?.MetadataId}|`,
            `|*Entity-Id:*           ||${this.entity?.entityId}|`,
            `|*Entity-Name:*         ||${this.entityData?.EntityLogicalName}|`,  
            `|*Entity-Set:*          ||${this.entity?.entitySetName}|`,
        ];
        
        if (this.entityData?.Description?.LocalizedLabels?.Label) { items.push(`\n---\n${this.entityData?.Description?.LocalizedLabels?.Label}`); }
        
        this.tooltip     = new vscode.MarkdownString(items.filter(item => item).join("\n"));
    }

    public readonly entityId: string;
    public readonly entitySetName: string;
    public readonly displayName: string;
    public readonly connectionReferences: any;
    public readonly databaseReferences: any;

    contextValue = 'EntityColumn';

    // iconPath = {
	// 	light: path.join(path.dirname(__filename), '..', '..', 'media', 'entity.svg'),
	// 	dark: path.join(path.dirname(__filename), '..', '..', 'media', 'entity.svg')
	// };

    static convert (data: any, environment: Environment, entity: Entity, solution?: Solution): EntityColumn {
        const column    = new EntityColumn(
            `${environment.id}/${entity.id}/${solution?.solutionData?.solutionid ?? '-'}/${data.SchemaName}`,
            data.SchemaName,
            data,
            vscode.TreeItemCollapsibleState.None,
            environment,
            entity
        );
        return column;
    };

    static sort (p1: EntityColumn, p2: EntityColumn): number {
        return (p1.displayName?.toLowerCase() === p2.displayName?.toLowerCase()) ? 0 : (p1.displayName?.toLowerCase() < p2.displayName?.toLowerCase() ? -1 : 1);
    };
}