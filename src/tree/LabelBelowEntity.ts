import { TreeItemWithParent } from "./TreeItemWithParent";
import * as vscode from 'vscode';
import { Solution } from "../entities/Solution";
import { Utils } from "../helpers/Utils";
import { Connector } from "../entities/Connector";
import { CloudFlow } from "../entities/CloudFlow";
import { CanvasApp } from "../entities/CanvasApp";
import { PowerAppsDataProvider } from "./PowerAppsDataProvider";
import { APIUtils } from "../helpers/APIUtils";
import { ModelDrivenApp } from "../entities/ModelDrivenApp";
import { Entity } from "../entities/Entity";
import { EntityColumn } from "../entities/EntityColumn";

export class LabelBelowEntity extends TreeItemWithParent {

    constructor(
        public readonly name: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly entity: Entity,
        public readonly command?: vscode.Command
    ) {
        super(name, collapsibleState, entity);
    }    

    contextValue = 'labelBelowEntity';
 
    /**
     * Get all columns for the entity
     */
     async getColumns(): Promise<EntityColumn[]> {
        const convertAttribute = (data: any): EntityColumn => EntityColumn.convert(data, this.entity.environment, this.entity, this.entity.solution);
        const convert = (data: any): any => data;
        const metadata = await APIUtils.getEntityAttributes(this.entity.environment.instanceApiUrl, convert, undefined, undefined, undefined, this.entity.entityData.entityid);

        var columns : EntityColumn[] = [];
        var attributes: any = metadata[0].Attributes;
        if (attributes !== undefined) {
            columns = attributes
                ? attributes.map((ti: any) => convertAttribute(ti))
                : [];
        }
        return columns.sort(EntityColumn.sort);
    }

}