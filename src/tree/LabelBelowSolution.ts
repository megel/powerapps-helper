import { TreeItemWithParent } from "./TreeItemWithParent";
import * as vscode from 'vscode';
import { Solution } from "../entities/Solution";
import { Utils } from "../helpers/Utils";
import { Connector } from "../entities/Connector";
import { CloudFlow } from "../entities/CloudFlow";
import { CanvasApp } from "../entities/CanvasApp";

export class LabelBelowSolution extends TreeItemWithParent {

    constructor(
        public readonly name: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly solution: Solution,
        public readonly command?: vscode.Command
    ) {
        super(name, collapsibleState, solution);
    }    

    contextValue = 'labelBelowSolution';


    /**
     * Get all custom connectors for the solution
     */
     async getConnectors(): Promise<Connector[]> {
        const convert = (data: any): Connector => Connector.convert(data, this.solution.environment, this.solution);
        return await Utils.getConnectors(this.solution.environment.instanceApiUrl, convert, Connector.sort, undefined, undefined, this.solution.solutionData.solutionid);
    }

    /**
     * Get all cloud flows for the solution
     */
     async getCloudFlows(): Promise<CloudFlow[]> {
        const convert = (data: any): CloudFlow => CloudFlow.convert(data, this.solution.environment, this.solution);
        return await Utils.getCloudFlows(this.solution.environment.instanceApiUrl, convert, CloudFlow.sort, undefined, undefined, this.solution.solutionData.solutionid);
    }

    /**
     * Get all canvas apps for the solution
     */
     async getCanvasApps(): Promise<CanvasApp[]> {
        const convert = (data: any): CanvasApp => CanvasApp.convert(data, this.solution.environment, this.solution);
        return await Utils.getCanvasApps(this.solution.environment.instanceApiUrl, convert, CanvasApp.sort, undefined, undefined, this.solution.solutionData.solutionid);
    }
}