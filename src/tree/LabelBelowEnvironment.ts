import { TreeItemWithParent } from "./TreeItemWithParent";
import * as vscode from 'vscode';
import { Environment } from "../entities/Environment";
import { Solution } from "../entities/Solution";
import { Utils } from "../helpers/Utils";
import { Connector } from "../entities/Connector";
import { CloudFlow } from "../entities/CloudFlow";
import { CanvasApp } from "../entities/CanvasApp";

export class LabelBelowEnvironment extends TreeItemWithParent {

    constructor(
        public readonly name: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly command?: vscode.Command
    ) {
        super(name, collapsibleState, environment);
    }    

    contextValue = 'labelBelowEnvironment';


    /**
     * Get all solutions for the environment
     */
    async getSolutions(): Promise<Solution[]> {
        const convert = (data: any): Solution => Solution.convert(this.environment, data);
        return await Utils.getSolutions(this.environment.instanceApiUrl, convert, Solution.sort);
    }

    /**
     * Get all custom connectors for the environment
     */
     async getConnectors(): Promise<Connector[]> {
        const convert = (data: any): Connector => Connector.convert(data, this.environment);
        return await Utils.getConnectors(this.environment.instanceApiUrl, convert, Connector.sort);
    }

    /**
     * Get all cloud flows for the environment
     */
     async getCloudFlows(): Promise<CloudFlow[]> {
        const convert = (data: any): CloudFlow => CloudFlow.convert(data, this.environment);
        return await Utils.getCloudFlows(this.environment.instanceApiUrl, convert, CloudFlow.sort);
    }

    /**
     * Get all canvas apps for the environment
     */
     async getCanvasApps(): Promise<CanvasApp[]> {
        const convert = (data: any): CanvasApp => CanvasApp.convert(data, this.environment);
        return await Utils.getCanvasApps(this.environment.instanceApiUrl, convert, CanvasApp.sort);
    }
}