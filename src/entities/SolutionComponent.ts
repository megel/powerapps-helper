import * as path from 'path';
import * as vscode from 'vscode';
import { Utils } from '../helpers/Utils';
import { TreeItemWithParent } from '../tree/TreeItemWithParent';
import { ComponentType } from './ComponentType';
import { Environment } from './Environment';
import { Solution } from './Solution';

export class SolutionComponent {

    constructor(
        public readonly objectId: string,
        public readonly componentType: ComponentType,
        public readonly solutionComponentId: string
    ) {
        this.objectId            = objectId;
        this.componentType          = componentType;
        this.solutionComponentId = solutionComponentId;
    }

    static convert (data: any): SolutionComponent {            
        return new SolutionComponent(
        data.objectid,
        data.componenttype,
        data.solutioncomponentid);
    };
}