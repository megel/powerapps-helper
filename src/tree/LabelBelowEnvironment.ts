import { TreeItemWithParent } from "./TreeItemWithParent";
import * as vscode from 'vscode';
import { Environment } from "../entities/Environment";
import { Solution } from "../entities/Solution";
import { Utils } from "../helpers/Utils";
import { Connector } from "../entities/Connector";
import { CloudFlow } from "../entities/CloudFlow";
import { CanvasApp } from "../entities/CanvasApp";
import { PowerApp } from "../entities/PowerApp";
import { PowerAppsDataProvider } from "./PowerAppsDataProvider";
import { APIUtils } from "../helpers/APIUtils";
import { PowerAppsAPI } from "../entities/PowerAppsAPI";
import { ModelDrivenApp } from "../entities/ModelDrivenApp";

export class LabelBelowEnvironment extends TreeItemWithParent {

    constructor(
        public readonly name: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly environment: Environment,
        public readonly dataProvider: PowerAppsDataProvider,
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
        return await APIUtils.getSolutions(this.environment.instanceApiUrl, convert, Solution.sort);
    }

    /**
     * Get all custom connectors for the environment
     */
     async getConnectors(): Promise<Connector[]> {
        const convert = (data: any): Connector => Connector.convert(data, this.environment);
        return await APIUtils.getConnectors(this.environment.instanceApiUrl, convert, Connector.sort);
    }

    /**
     * Get all cloud flows for the environment
     */
     async getCloudFlows(): Promise<CloudFlow[]> {
        const convert = (data: any): CloudFlow => CloudFlow.convert(data, this.environment);
        return await APIUtils.getCloudFlows(this.environment.instanceApiUrl, convert, CloudFlow.sort);
    }

    /**
     * Get all canvas apps for the environment
     */
     async getCanvasApps(): Promise<CanvasApp[]> {
        const convert = (data: any): CanvasApp => CanvasApp.convert(data, this.environment);
        return await APIUtils.getCanvasApps(this.environment.instanceApiUrl, convert, CanvasApp.sort);
    }

    /**
     * Get all model driven apps for the environment
     */
     async getModelDrivenApps(): Promise<ModelDrivenApp[]> {
        const convert = (data: any): ModelDrivenApp => ModelDrivenApp.convert(data, this.environment);
        return await APIUtils.getModelDrivenApps(this.environment.instanceApiUrl, convert, ModelDrivenApp.sort);
    }    

    /** 
     * get the PowerApps from Makers API
     */
     async getPowerApps(): Promise<PowerApp[]> {
        const environments = this.dataProvider.cachedEnvironments || (this.dataProvider.cachedEnvironments = (await Environment.getEnvironments()));
        return await APIUtils.getPowerApps((data) => PowerApp.convert(data, environments), PowerApp.sort, (app:PowerApp) => app.environment === this.environment && PowerApp.filter(app));
    }

    /** 
     * get all Custom Connectors from Power Apps Admin API
     */
     async getPowerAppsAPIs(): Promise<PowerAppsAPI[]> {
        //const environments = this.dataProvider.cachedEnvironments || (this.dataProvider.cachedEnvironments = (await Environment.getEnvironments()));
        return await APIUtils.getPowerAppsAPIs(this.environment, (data) => PowerAppsAPI.convert(data, this.environment), PowerAppsAPI.sort, (api) => api.isCustomApi);
    }
    
}