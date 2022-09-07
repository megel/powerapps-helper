import * as vscode from 'vscode';
import * as axios from 'axios';
import * as uuid from 'uuid';
import * as util from 'util';
import * as stream from 'stream';
import * as xml2js from 'xml2js';
import { Settings } from "./Settings";
import { OAuthUtils } from "./OAuthUtils";
import { PowerApp } from '../entities/PowerApp';
import {Environment} from '../entities/Environment';
import { Solution } from '../entities/Solution';
import { SolutionComponent } from '../entities/SolutionComponent';
import { ComponentType } from '../entities/ComponentType';
import { promises as fsPromises } from 'fs'; 
import { Utils } from './Utils';
import { SolutionUtils } from './SolutionUtils';
import { PowerAppsAPI } from '../entities/PowerAppsAPI';
import promise = require('glob-promise');
import { resolve } from 'dns';
import { getOutputChannel } from '../extension';
import { outputHttpLog } from '../extension';
import { outputHttpResult } from '../extension';

export class APIUtils {

    /**
     * Get the Environments from API (https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-environments)
     * @param convert - callback to convert the results to a PowerAppVersions
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     */
    public static async getEnvironments<T>(
        convert: (ti: any) => T,         
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined) : Promise<T[]>
    {
        var url = "https://api.powerapps.com/providers/Microsoft.PowerApps/environments/?api-version=2020-07-01";
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getPowerAppAPIToken());
    }

    /**
     * Get the PowerApps from API (https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-apps)
     * @param convert - callback to convert the results to a PowerAppVersions
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     */
    public static async getPowerApps<T>(
        convert: (ti: any) => T,         
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined) : Promise<T[]>
    {
        var url = "https://api.powerapps.com/providers/Microsoft.PowerApps/apps/?api-version=2020-07-01&$expand=unpublishedAppDefinition";
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getPowerAppAPIToken());
    }

    /**
     * Get the Versions of a PowerApp from API (https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-app-versions)
     * @param app (mandatory) - The PowerApp name
     * @param convert - callback to convert the results to a PowerAppVersions
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     */
    public static async getPowerAppVersions<T>(
        app: string,
        convert: (ti: any) => T,         
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined) : Promise<T[]>
    {
        var url = `https://api.powerapps.com/providers/Microsoft.PowerApps/apps/${app}/versions?api-version=2020-07-01`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getPowerAppAPIToken());
    }

    /**
     * Get the PowerApps API from API (https://docs.microsoft.com/en-us/connectors/powerappsforadmins/#get-custom-connectors-as-admin)
     * @param environment (mandatory) - The PowerApps Environment name
     * @param convert - callback to convert the results to a PowerAppVersions
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     */
     public static async getPowerAppsAPIs<T>(
        environment: Environment,
        convert: (ti: any) => T,         
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined) : Promise<T[]>
    {
        var url = `https://api.powerapps.com/providers/Microsoft.PowerApps/apis/?$filter=environment%20eq%20%27${environment.name}%27&api-version=2020-07-01`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getPowerAppAPIToken());
    }

    /**
     * Get the PowerApps API from API (https://docs.microsoft.com/en-us/connectors/powerappsforadmins/#get-custom-connectors-as-admin)
     * @param environment (mandatory) - The PowerApps Environment name
     * @param connector (mandatory) - The PowerApps API name
     * @param convert - callback to convert the results to a PowerAppVersions
     */
     public static async getPowerAppsAPI<T>(
        environment: Environment,
        connector: string,
        convert: (ti: any) => T,
        bearerToken?: string | undefined) : Promise<T | undefined>
    {
        var url = `https://api.powerapps.com/providers/Microsoft.PowerApps/apis/${connector || ''}?$filter=environment%20eq%20%27${environment.name}%27&api-version=2020-07-01`;
        return await Utils.getWithReturnSingle<T>(url, convert, bearerToken || await OAuthUtils.getPowerAppAPIToken());
    }

    /**
     * Update the PowerApps API from API (https://docs.microsoft.com/en-us/connectors/powerappsforadmins/#get-custom-connectors-as-admin)
     * @param environment (mandatory) - The PowerApps Environment name
     * @param connector (mandatory) - The PowerApps API name
     * @param properties (mandatory) - The PowerApps API properties
     */
     public static async updatePowerAppsAPI(
        environment: Environment,
        connector: string,
        properties: any,
        bearerToken?: string | undefined) : Promise<any | undefined>
    {
        var url = `https://api.powerapps.com/providers/Microsoft.PowerApps/apis/${connector || ''}?$filter=environment%20eq%20%27${environment.name}%27&api-version=2020-07-01`;
        
        // eslint-disable-next-line @typescript-eslint/naming-convention
        var headers:any = { 'Content-Type': 'application/json' };
        if (bearerToken !== undefined) {
            headers.Authorization = `Bearer ${bearerToken}`;
        }
        
        outputHttpLog(`  PATCH ${url}`);                    
        var response = await axios.default.patch(url, properties, { headers: headers });
        outputHttpResult(response);

        return response.data;
    }

    /**
     * Get the Solutions from Dynamics 365 API (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/solutions)
     * @param uri (mandatory) - The Dynamics 365 API URI
     * @param convert - callback to convert the results
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     */
    public static async getSolutions<T>(
        uri: string,
        convert: (ti: any) => T,         
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined) : Promise<T[]>
    {
        var url = `${uri}/api/data/v9.1/solutions?$filter=${encodeURI('isvisible eq true')}`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getCrmToken(uri));
    }

    /**
     * Get the Connectors from Dynamics 365 API (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/connectors)
     * @param uri (mandatory) - The Dynamics 365 API URI
     * @param convert - callback to convert the results
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     * @param solutionId - the optional solutionId
     */
     public static async getConnectors<T>(
        uri: string,
        convert: (ti: any) => T, 
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined,
        solutionId?: string | undefined) : Promise<T[]>
    {
        var filters = [];
        if (solutionId) {
            var customConnectors = await APIUtils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.customConnector);
            if (customConnectors.length > 0) {
                filters.push(customConnectors.map(component => `(connectorid eq ${component.objectId})`).join(' or '));
            }
            var flowComponents = await APIUtils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.connector);
            if (flowComponents.length > 0) {
                filters.push(flowComponents.map(component => `(connectorid eq ${component.objectId})`).join(' or '));
            }
            if (filters.length <= 0) {
                return [];
            }            
        }
        var url = `${uri}/api/data/v9.1/connectors${filters.length > 0 ? '?$filter=' + encodeURI(filters.join(' and ')): ''}`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getCrmToken(uri));
    }
    
    /**
     * Get the Cloud (Modern) Flows from Dynamics 365 API (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/workflow)
     * @param uri (mandatory) - The Dynamics 365 API URI
     * @param convert - callback to convert the results
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     * @param solutionId - the optional solutionId
     */
     public static async getCloudFlows<T>(
        uri: string,
        convert: (ti: any) => T, 
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined,
        solutionId?: string | undefined) : Promise<T[]>
    {
        var filters = [];
        filters.push('(category eq 5)');
        if (solutionId) {
            const flowComponents = await APIUtils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.workFlow);
            if (flowComponents.length <= 0) {
                return [];
            }
            filters.push(flowComponents.map(component => `(workflowid eq ${component.objectId})`).join(' or '));                        
        }
        var url = `${uri}/api/data/v9.1/workflows${filters.length > 0 ? '?$filter=' + encodeURI(filters.join(' and ')): ''}`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getCrmToken(uri));
    }

    /**
     * Get the Canvas Apps from Dynamics 365 API (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/workflow)
     * @param uri (mandatory) - The Dynamics 365 API URI
     * @param convert - callback to convert the results
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     * @param solutionId - the optional solutionId
     */
     public static async getCanvasApps<T>(
        uri: string,
        convert: (ti: any) => T, 
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined,
        solutionId?: string | undefined) : Promise<T[]>
    {
        var filters = [];
        if (solutionId) {
            const flowComponents = await APIUtils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.canvasApp);
            if (flowComponents.length <= 0) {
                return [];
            }
            filters.push(flowComponents.map(component => `(canvasappid eq ${component.objectId})`).join(' or '));
        }
        var url = `${uri}/api/data/v9.1/canvasapps${filters.length > 0 ? '?$filter=' + encodeURI(filters.join(' and ')): ''}`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getCrmToken(uri));
    }

    /**
     * Get the Entities from Dynamics 365 API (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/entity)
     * @param uri (mandatory) - The Dynamics 365 API URI
     * @param convert - callback to convert the results
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     * @param solutionId - the optional solutionId
     */
     public static async getEntities<T>(
        uri: string,
        convert: (ti: any) => T, 
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined,
        solutionId?: string | undefined) : Promise<T[]>
    {
        var filters: string[] = [];
        if (solutionId) {
            const flowComponents = await APIUtils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.entity);
            if (flowComponents.length <= 0) {
                return [];
            }
            //filters.push(`entityid in (${flowComponents.map(component => `${component.objectId}`).join(',')})`);
            filters.push(flowComponents.map(component => `(entityid eq ${component.objectId})`).join(' or '));
        }
        var url = `${uri}/api/data/v9.1/entities${filters.length > 0 ? '?$filter=' + encodeURI(filters.join(' and ')): ''}`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getCrmToken(uri));
    }

    /**
     * Get the Entities from Dynamics 365 API (https://docs.microsoft.com/en-us/powerapps/developer/data-platform/webapi/query-metadata-web-api)
     * @param uri (mandatory) - The Dynamics 365 API URI
     * @param convert - callback to convert the results
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     * @param entityId - the optional solutionId
     */
     public static async getEntityAttributes<T>(
        uri: string,
        convert: (ti: any) => T, 
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined,
        entityId?: string | undefined) : Promise<T[]>
    {
        var filters: string[] = [];
        if (entityId) {
            filters.push(`(MetadataId eq ${entityId})`);
        }
        var url = `${uri}/api/data/v9.1/EntityDefinitions?$expand=Attributes${filters.length > 0 ? '&$filter=' + encodeURI(filters.join(' and ')): ''}`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getCrmToken(uri));
    }

    /**
     * Get the Model Driven Apps from Dynamics 365 API (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/appmodule)
     * @param uri (mandatory) - The Dynamics 365 API URI
     * @param convert - callback to convert the results
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     * @param solutionId - the optional solutionId
     */
     public static async getModelDrivenApps<T>(
        uri: string,
        convert: (ti: any) => T, 
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined,
        solutionId?: string | undefined) : Promise<T[]>
    {
        var filters: string[] = [];
        if (solutionId) {
            const flowComponents = await APIUtils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.appModule);
            if (flowComponents.length <= 0) {
                return [];
            }
            filters.push(flowComponents.map(component => `(appmoduleid eq ${component.objectId})`).join(' or '));
        }
        var url = `${uri}/api/data/v9.1/appmodules${filters.length > 0 ? '?$filter=' + encodeURI(filters.join(' and ')): ''}`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getCrmToken(uri));
    }    

    /**
     * Get the Solution Components from Dynamics 365 API (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/solutioncomponent)
     * @param uri (mandatory) - The Dynamics 365 API URI
     * @param convert - callback to convert the results
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     * @param solutionId - the optional solutionId
     */
     public static async getSolutionComponents<T>(
        uri: string,
        convert: (ti: any) => T, 
        sort?: ((t1: T, t2: T) => number) | undefined, 
        filter?: ((t1: T) => boolean) | undefined,
        bearerToken?: string | undefined,
        solutionId?: string | undefined,
        componentType?: ComponentType) : Promise<T[]>
    {
        var filters = [];
        if (solutionId) {
            filters.push(`(_solutionid_value eq ${solutionId})`);
        }
        if (componentType) {
            filters.push(`(componenttype eq ${componentType})`);
        }
        var url = `${uri}/api/data/v9.1/solutioncomponents?$select=objectid,componenttype${filters.length > 0 ? '&$filter=' + encodeURI(filters.join(' and ')): ''}`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getCrmToken(uri));
    }
    


    /**
     * Download and Unpack a PowerApp
     * @param app - The PowerApp to download
     */
    public static async downloadAndUnpackPowerApp(app: PowerApp): Promise<void> {
        const id: string = uuid.v4();
        const fs = require('fs');
        let rootPath = vscode.workspace.rootPath;
        if (rootPath === undefined) {
            vscode.window.showErrorMessage('Please open a Folder or Workspace!');
            return;
        } 
        const filePath = `${rootPath}/${id}.msapp`;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Download and Unpack Power App ${app.displayName}`,
            cancellable: false
        }, async (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>, token: vscode.CancellationToken): Promise<void> => {
            
            const powerAppPath = await SolutionUtils.getWorkspacePowerAppPath(`${app.displayName.toLowerCase().replace(/[^a-z0-9]/gi, '')}`);

            try {
                const file: NodeJS.WritableStream = fs.createWriteStream(filePath);
                const response = await axios.default.get(app.downloadUrl, {responseType: 'stream'});
                
                const finished = util.promisify(stream.finished);            
                await response.data.pipe(file);
                await finished(file);
                await file.end();
                if (! await Utils.checkPowerPlatformCli()) { return; }
                const cmd = await Utils.getPowerPlatformCliCommandLine(`canvas unpack --msapp "${filePath}" --sources "${powerAppPath}"`);
                await Utils.executeChildProcess(cmd);

                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    vscode.window.showErrorMessage(`${err}`);
                }
            } catch (err: any) {
                vscode.window.showErrorMessage(`${err}`);
            }
            vscode.window.showInformationMessage(`Power App ${app.displayName} downloaded.`);  
            return new Promise(resolve=>resolve());
        });
    }

    /**
     * Download and Unpack a Solution
     * @param solution - The Solution to download
     */
    public static async downloadAndUnpackSolution(solution: Solution): Promise<void> {
        const id: string = uuid.v4();
        const fs = require('fs');
        const path = require('path');
        let rootPath = vscode.workspace.rootPath;
        if (rootPath === undefined) {
            vscode.window.showErrorMessage('Please open a Folder or Workspace!');
            return;
        } 
        const filePath = `${rootPath}/${id}.zip`;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Download and Unpack solution`,
            cancellable: false
        }, async (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>, token: vscode.CancellationToken): Promise<void> => {
            
            try {
                progress.report({message: `Start downloading solution ${solution.name} from ${solution.environment.displayName}`});
                const bearerToken = await OAuthUtils.getCrmToken(solution.environment.instanceApiUrl);
                const url         = `${solution.environment.instanceApiUrl}/api/data/v9.1/ExportSolution`;
                // eslint-disable-next-line @typescript-eslint/naming-convention
                var headers : any = { 'Content-Type': 'application/json',       'Authorization': `Bearer ${bearerToken}` };
                // eslint-disable-next-line @typescript-eslint/naming-convention
                var data    : any = { 'SolutionName': `${solution.uniqueName}`, 'Managed':       solution.isManaged };
                
                outputHttpLog(`   POST ${url}`);
                var response = await axios.default.post(url, data, { headers: headers });
                outputHttpResult(response);

                const file: NodeJS.WritableStream = fs.createWriteStream(filePath);
                const bytes    = Buffer.from(response.data.ExportSolutionFile, 'base64');
                
                await file.write(bytes);
                await file.end();
                
                var solutionPath = await SolutionUtils.getWorkspaceSolutionPath(solution.uniqueName);
                if (! solutionPath) { return; }
                solutionPath = path.resolve(solutionPath);
                
                progress.report({message: `Unpack solution ${solution.displayName} to workspace to: "${solutionPath}"`});
                await SolutionUtils.unpackSolution(`${solutionPath}`, filePath);

                progress.report({message: `Prettify JSON files...`});
                var glob = require("glob-promise");
                var files = await glob.promise(`${solutionPath}/**/*.json`, {});
                await Promise.all(files.map(async (filename:string) => await Utils.prettifyJson(filename, filename) ));

                progress.report({message: `Prettify XML files...`});
                var files = await glob.promise(`${solutionPath}/**/[Content_Types].xml`, {});
                await Promise.all(files.map(async (filename:string) => await Utils.prettifyXml(filename, filename) ));

                progress.report({message: `Unpack Canvas Apps...`});
                var files = await glob.promise(`${solutionPath}/**/*.msapp`, {});
                await Promise.all(files.map(async (filename:string) => {
                    const unpackedPath = `${filename}`.replace(".msapp", "_msapp_src");
                    var   result       = await SolutionUtils.unpackPowerApp(filename, unpackedPath, (result) => progress.report({message: result}));
                    if (result) 
                    {
                        fs.unlinkSync(filename);
                    }
                }));

                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    vscode.window.showErrorMessage(`${err}`);
                }

                vscode.window.showInformationMessage(`Solution ${solution.name} downloaded.`);            
            } catch (err: any) {
                vscode.window.showErrorMessage(`${err}`);
            } finally {
                progress.report({increment: 100});
            }
            return new Promise(resolve=>resolve());
        });
    }



    /*
    IMPORT SOLUTION
    https://github.com/MicrosoftDocs/power-automate-docs/blob/live/articles/web-api.md#import-flows
    POST https://org00000000.crm0.dynamics.com/api/data/v9.1/ImportSolution
    Accept: application/json
    Authorization: Bearer ey...
    Content-type: application/json
    {
        "OverwriteUnmanagedCustomizations": false,
        "PublishWorkflows" : true,
        "ImportJobId" : "00000000-0000-0000-0000-000000000006",
        "CustomizationFile" : "UEsDBBQAAgAI..."
    }
    */
    /**
     * Pack the current Solution from Workspace
     * @param saveAsFile true, to save as file.
     */
    public static async packWorkspaceSolution(saveAsFile: boolean = false, environment?: Environment): Promise<string | undefined> {
        let rootPath = vscode.workspace.rootPath;
        if (rootPath === undefined) {
            vscode.window.showErrorMessage('Please open a Folder or Workspace!');
            return;
        }
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: environment ? `Import workspace solution` : `Pack workspace solution`,
            cancellable: false
        }, async (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>, token: vscode.CancellationToken): Promise<void> => {
            var localSolution = await SolutionUtils.getWorkspaceSolution();
            var envSolution: Solution | undefined = undefined;
            try {      
                // Select Solution on a MultiSolution Workspace
                const sourceFolder = localSolution?.solutionPath ?? await SolutionUtils.getWorkspaceSolutionPath(localSolution?.uniqueName);
                if (! sourceFolder) { return; }
                const targetFolder = `${rootPath}/${Settings.outputFolder()}`;
                
                if (environment) {
                    envSolution = (await APIUtils.getSolutions(environment.instanceApiUrl, item => Solution.convert(environment, item), undefined, s => s?.uniqueName === localSolution?.uniqueName)).find(item => true);                    
                }
                var isManaged = envSolution?.solutionData?.ismanaged  ?? localSolution.managed === 1;
                var isManagedItems = [];
                if (envSolution === undefined || envSolution?.solutionData?.ismanaged) {
                    isManagedItems.push({label: 'Managed',   isManaged: true,  description:  "(recommended)"});
                }
                if (envSolution === undefined || ! envSolution?.solutionData?.ismanaged) {
                    isManagedItems.push({label: 'Unmanaged', isManaged: false, description:  ""});
                }                    
                var isManagedResult = await vscode.window.showQuickPick(isManagedItems);
                if (isManagedResult === undefined) {
                    return;
                } else {
                    isManaged = isManagedResult.isManaged;
                }
                //var localVersionNumbers = `${localSolution.version}`.split('.'); 2.2.0.0
                //var envVersionNumbers   = `${envSolution?.solutionData?.version}`.split('.');
                var versionNumbers : string [] = `${envSolution?.solutionData?.version ?? localSolution.version}`.split('.');
                
                let versionItems = [
                    { label: `${versionNumbers[0]}.${versionNumbers[1]}.${versionNumbers[2]}.${versionNumbers[3]}`,             isDefault: ! isManaged, description: "Current Version"    + (! isManaged ? " (recommended)" : ""), detail: "Import Version" },
                    { label: `${versionNumbers[0]}.${versionNumbers[1]}.${versionNumbers[2]}.${Number(versionNumbers[3]) + 1}`, isDefault: isManaged,   description: "Increased Revision" + (isManaged   ? " (recommended)" : ""), detail: "Import Version" },
                    { label: `${versionNumbers[0]}.${versionNumbers[1]}.${Number(versionNumbers[2]) + 1}.${versionNumbers[3]}`, isDefault: false,       description: "Increased Build",                                            detail: "Import Version" },
                    { label: `custom version`, description: "Specify manual a version", individual: true}
                ];
                
                let newVersion = await vscode.window.showQuickPick(versionItems);
                var version = newVersion?.label;
                if (version === undefined) { return; }
                if (newVersion?.individual === true) {
                    version = `${(await vscode.window.showInputBox({prompt: `Version:`, value: localSolution.version ?? envSolution?.solutionData?.version, ignoreFocusOut: true, placeHolder: 'Enter the new Solution Version'}))}`;
                }
                if (version === undefined) { return; }
                
                // Create Temp-Folder for new Solution
                const solutionName = localSolution !== undefined ? `${localSolution.publisher} ${localSolution.uniqueName} ${version}` : `solution`;
                const fs   = require("fs");
                if (fs.existsSync(`${targetFolder}/${solutionName}`)) {
                    await fs.rmdirSync(`${targetFolder}/${solutionName}`, { recursive: true });
                }
                if (!fs.existsSync(`${targetFolder}`)) {
                    fs.mkdirSync(`${targetFolder}`, { recursive: true });
                }                
                await Utils.copyRecursive(sourceFolder, `${targetFolder}/${solutionName}`);
                await SolutionUtils.updateSolution(`${targetFolder}/${solutionName}`, version, isManaged);
                progress.report({ message: `Compress Json files...` });
                var glob = require("glob-promise");
                var files = await glob.promise(`${targetFolder}/${solutionName}/**/*.json`, {});
                await Promise.all(files.map(async (filename:string) => await Utils.minifyJson(filename, filename) ));
                
                progress.report({ message: `Pack Canvas Apps ...` });
                var files = fs.existsSync(`${targetFolder}/${solutionName}/CanvasApps/`) ? await fs.readdirSync(`${targetFolder}/${solutionName}/CanvasApps/`) : [];
                await Promise.all(files.map(async (file:string) => {
                    if (token.isCancellationRequested) { return; }
                    if (file.endsWith('_msapp_src')) {
                        const packedPath = `${targetFolder}/${solutionName}/CanvasApps/${file}`.replace("_msapp_src",".msapp");
                        var   result     = await SolutionUtils.packPowerApp(packedPath, `${targetFolder}/${solutionName}/CanvasApps/${file}`, (result) => progress.report({ message: result }));
                        if (result) {
                            await fs.rmdirSync(`${targetFolder}/${solutionName}/CanvasApps/${file}`, { recursive: true });
                        }                
                    }
                }));
                
                if (token.isCancellationRequested) { return; }
                progress.report({ message: `Create Solution Package "${targetFolder}/${solutionName}${isManaged ? "_managed" : ""}.zip" ...` });
                
                var buffer = await SolutionUtils.packSolution(`${targetFolder}/${solutionName}`, `${targetFolder}/${solutionName}${isManaged ? "_managed" : ""}.zip`, isManaged);
                if (! buffer) { 
                    vscode.window.showErrorMessage(`Packing solution failed.`);
                    return;
                }
                await fs.rmdirSync(`${targetFolder}/${solutionName}`, { recursive: true });
               
                if (environment) {
                    var data : any = {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        "OverwriteUnmanagedCustomizations": false,
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        "PublishWorkflows" :                true,
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        "ImportJobId" :                     uuid.v4(),
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        "CustomizationFile" :               Buffer.from(buffer).toString('base64')
                    };

                    progress.report({ increment: undefined, message: `Upload workspace solution ${solutionName} for import into ${environment?.displayName}`});
                    
                    const bearerToken = await OAuthUtils.getCrmToken(environment?.instanceApiUrl || "");
                    const url         = `${environment?.instanceApiUrl}/api/data/v9.1/ImportSolution`;
                    getOutputChannel().appendLine(`\nImport Solution started...`);
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    var headers : any = { 'Content-Type': 'application/json',       'Authorization': `Bearer ${bearerToken}` };
                    
                    outputHttpLog(`   POST ${url}`);
                    var response = await axios.default.post(url, data, { headers: headers, 
                        maxBodyLength: 104857600, //100mb
                        maxContentLength: 104857600, //100mb
                    });
                    outputHttpResult(response);

                    if (response.status === 204) {
                        getOutputChannel().appendLine(`\nImport solution in ${environment?.displayName} complete.`);
                        vscode.window.showInformationMessage(`Upload solution in ${environment?.displayName} complete.`);
                    } else {
                        getOutputChannel().appendLine(`\nWARN Import solution returned with Status Code: ${response.status} ${response.statusText}`);
                        vscode.window.showWarningMessage(`Upload solution returned with Status Code: ${response.status} ${response.statusText}`);
                    }
                    // Get Solution ID
                    var solutionId = localSolution.id;
                    if (! solutionId) {
                        const envSolution = (await APIUtils.getSolutions(environment.instanceApiUrl, item => Solution.convert(environment, item), undefined, s => s?.uniqueName === localSolution?.uniqueName)).find(item => true);
                        solutionId = envSolution?.id;
                    }
                    // Update the solution APIs after import
                    if (solutionId) {
                        await this.updateOAuthForSolution(environment, solutionId, bearerToken);
                    }
                } else if (saveAsFile) {
                    vscode.window.showInformationMessage(`Workspace Solution ${solutionName} packed into ${targetFolder}/${solutionName}.zip`);
                }                                
            } catch (err: any) {
                vscode.window.showErrorMessage(`${err}`);
            }
            return new Promise(resolve=>resolve());
        });
    }

    /**
	 * Update the OAuth2 settings of a custom connector.
	 * @param api to update.
	 */
     static async updateOAuthForSolution(environment: Environment, solutionId?: string | undefined, bearerToken?: string | undefined): Promise<void> {
		
        try {
            if (! bearerToken) { bearerToken = await OAuthUtils.getCrmToken(environment?.instanceApiUrl || ""); };
                    
            // Get API Components
            var components = await APIUtils.getSolutionComponents(environment?.instanceApiUrl || "", 
                (d: any) : any => { return { componentType: d.componenttype, objectId: d.objectid, solutionComponentId: d.solutioncomponentid }; }, 
                undefined,
                undefined,
                bearerToken, 
                solutionId, 
                ComponentType.customConnector);

            var xrmConnectorIds = components.map(c => c.objectId);            
            var apis = await APIUtils.getPowerAppsAPIs(environment, 
                d => PowerAppsAPI.convert(d, environment),
                PowerAppsAPI.sort,
                d => d.oAuthSettings && xrmConnectorIds.includes(d?.xrmConnectorId));

            await APIUtils.batchUpdateOAuth(apis);
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
        }
    }    

    /**
	 * Update the OAuth2 settings of a custom connector.
	 * @param api to update.
	 */
	static async batchUpdateOAuth(apis: PowerAppsAPI[]): Promise<void> {
		if (apis === undefined || apis.length === 0) { 
			vscode.window.showInformationMessage(`No OAuth-Settings found for update.`);
            return;
		}
        
        // Update OAuth2 Settings
		if (await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `Update OAuth-Settings...`,
			cancellable: false            
		}, async (): Promise<boolean> => {
            let apiItems: any = apis.map(api => {
                return {
                    detail: `${api.environment.displayName || ''}`,
                    label: `${api.displayName}`,
                    description: api.description,
                    api: api,
                    isDefault: false,
                    picked: true
                };
            }).sort((p1, p2) => p1.isDefault ? -1 : (p1.label < p2.label ? -1 : 1));
            apis = (await vscode.window.showQuickPick(apiItems, { ignoreFocusOut: true, canPickMany: true }))?.map((s: any): PowerAppsAPI => s.api) ?? [];
            
            let tasks = [];
            for await (const api of apis) {
                try {
                    const convert = (data: any) => { return data.properties; };
                    let properties = await this.getPowerAppsAPI(api.environment, api.name, convert); 
        
                    if (! properties?.connectionParameters?.token?.oAuthSettings) {
                        return false;
                    }
                    let envName      = api.environment.name;
                    let apiId        = api.id;
                    let settings     = Settings.getAPIConnectionSettings(envName, `oauth.${properties?.connectionParameters?.token?.oAuthSettings?.identityProvider}`, apiId);
                    let clientId     = settings?.clientId ?? properties?.connectionParameters?.token?.oAuthSettings?.clientId;
                    let tenantId     = (properties?.connectionParameters?.token?.oAuthSettings?.customParameters?.tenantId?.value !== "common" ? settings?.tenantId : undefined) ?? properties?.connectionParameters?.token?.oAuthSettings?.customParameters?.tenantId?.value;
                    let resourceId   = properties?.connectionParameters?.token?.oAuthSettings?.customParameters?.resourceUri?.value;
                    
                    const service = 'mme2k-powerapps-helper';
                    resourceId   = await vscode.window.showInputBox({prompt: `Resource-Uri for ${api.displayName}`,   value: resourceId,   ignoreFocusOut: true, placeHolder: 'Enter the Resource-Uri here'});
                    if (resourceId) {
                        properties.connectionParameters.token.oAuthSettings.customParameters.resourceUri.value = resourceId;
                    } else { return false; }
                    tenantId     = await vscode.window.showInputBox({prompt: `Tenant-Id for ${api.displayName}`,     value: tenantId,     ignoreFocusOut: true, placeHolder: 'Enter the Tenant-Id here'});
                    if (tenantId) {
                        properties.connectionParameters.token.oAuthSettings.customParameters.tenantId.value = tenantId;
                    } else { return false; }
                    clientId     = await vscode.window.showInputBox({prompt: `Client-Id for ${api.displayName}`,     value: clientId,     ignoreFocusOut: true, placeHolder: 'Enter the Application-Id/Client-Id here'});
                    if (clientId) {
                        properties.connectionParameters.token.oAuthSettings.clientId = clientId;
                    } else { return false; }
                    
                    let clientSecret = undefined;
                    try {
                        const keytar  = require('keytar');
                        clientSecret = await keytar.getPassword(service, clientId);
                    } catch {}
                    clientSecret = await vscode.window.showInputBox({prompt: `Client-Secret for ${api.displayName}`, value: clientSecret, ignoreFocusOut: true, placeHolder: 'Enter the Client-Secret here', password: true});
                    if (clientSecret) {
                        properties.connectionParameters.token.oAuthSettings.clientSecret = clientSecret;
                        if (Settings.cacheAPIConnectionSecretes()) {
                            try {
                                const keytar  = require('keytar');
                                await keytar.setPassword(service, clientId, clientSecret);
                            } catch {}
                        }
                    } else { return false; }
        
                    let apiDefinitionUrl = properties.apiDefinitions.originalSwaggerUrl;

                    outputHttpLog(`    GET ${apiDefinitionUrl}`);
                    var response         = await axios.default.get(apiDefinitionUrl);
                    outputHttpResult(response);

                    let apiDefinition    = response.data;

                    tasks.push({ api: api, properties: properties, apiDefinition: apiDefinition});
                }
                catch (err: any) { 
                    vscode.window.showErrorMessage(`OAuth-Settings for ${api.displayName} in ${api.environment.displayName} failed.\n\n${err?.response?.data?.error?.message || err}`);
                    return false;
                }
            };

            let results = [];
            for (const task of tasks) {
                results.push(APIUtils.updateOAuth(task.api, task.properties, task.apiDefinition));
            }
            await Promise.all(results);
            return true;
		})) {
			vscode.window.showInformationMessage(`OAuth-Settings updated.`);
		}
    }

    /**
	 * Update the OAuth2 settings of a custom connector.
	 * @param api to update.
	 */
	static async updateOAuth(api: PowerAppsAPI, properties: any, apiDefinition: any): Promise<boolean> {
		if (! api || ! properties || !apiDefinition) { 
			return false;
		}
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Update OAuth-Settings for ${api.displayName} in ${api.environment.displayName}`,
                cancellable: true
            }, async (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>, token: vscode.CancellationToken): Promise<void> => {
                let apiProperties = {
                    properties: {
                        connectionParameters:   properties.connectionParameters,
                        capabilities:           properties.capabilities,
                        iconBrandColor:         properties.iconBrandColor,
                        //iconUri:                properties.iconUri,
                        openApiDefinition:      apiDefinition,
                        //displayName:            apiDefinition.info.title, // only for create
                        backendService: {
                            serviceUrl: `${apiDefinition.schemes[0]}://${apiDefinition.host}${apiDefinition.basePath}`
                        },
                        environment: {
                            id:         api.environment.id,
                            name:       api.environment.name
                        }           
                    }
                };
                if (apiDefinition.info.description) {
                    properties.description = apiDefinition.info.description;
                }

                // Debug
                // await vscode.window.showInputBox({prompt: properties, value: JSON.stringify(apiProperties)});
                if (token.isCancellationRequested) { return; }
                try {                    
                    await APIUtils.updatePowerAppsAPI(api.environment, api.name, apiProperties, await OAuthUtils.getPowerAppAPIToken());
                } catch (err: any) {
                    vscode.window.showErrorMessage(`OAuth-Settings for ${api.displayName} in ${api.environment.displayName} failed.\n\n${err?.response?.data?.error?.message || err}`);
                }
                
                vscode.window.showInformationMessage(`OAuth-Settings for ${api.displayName} in ${api.environment.displayName} updated.`);
            });
        } catch (err: any) {
            vscode.window.showErrorMessage(`OAuth-Settings for ${api.displayName} in ${api.environment.displayName} failed.\n\n${err?.response?.data?.error?.message || err}`);
            return false;
        }
        return true;
	}

    /**
     * Get the ParameterXml for PublishXml Action of Crm
     * https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/publishxml?view=dynamics-ce-odata-9
     * @param item Solution, CanvasApp, CloudFlow or Connector
     * @returns the XML that defines which solution components to publish in this request.
     */
    static async publishCustomizations(environment: Environment, parameterXml: string): Promise<void> {
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Publish customizations in ${environment.displayName}.`,
            cancellable: false
        }, async (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>, token: vscode.CancellationToken): Promise<void> => {
            try {
                const bearerToken = await OAuthUtils.getCrmToken(environment.instanceApiUrl);
                const url         = `${environment.instanceApiUrl}/api/data/v9.1/PublishXml`;
                // eslint-disable-next-line @typescript-eslint/naming-convention
                var headers : any = { 'Content-Type': 'application/json',       'Authorization': `Bearer ${bearerToken}` };
                
                outputHttpLog(`   POST ${url}`);
                // eslint-disable-next-line @typescript-eslint/naming-convention
                var response = await axios.default.post(url, { ParameterXml: parameterXml }, { headers: headers });
                outputHttpResult(response);
                
                vscode.window.showInformationMessage(`Customizations published in ${environment.displayName}.`);
            } catch (err: any) {
                vscode.window.showErrorMessage(`Publish Customizations in ${environment.displayName} failed.\n\n${err?.response?.data?.error?.message || err}`);
            }
            return new Promise(resolve=>resolve());
        });        
    }

    /**
     * Get the ParameterXml for PublishAllXml Action of Crm
     * https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/publishallxml?view=dynamics-ce-odata-9
     * @param environment
     * @returns the XML that defines which solution components to publish in this request.
     */
     static async publishAllCustomizations(environment: Environment): Promise<void> {
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Publish customizations in ${environment.displayName}.`,
            cancellable: false
        }, async (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>, token: vscode.CancellationToken): Promise<void> => {
            try {
                const bearerToken = await OAuthUtils.getCrmToken(environment.instanceApiUrl);
                const url         = `${environment.instanceApiUrl}/api/data/v9.1/PublishAllXml`;
                // eslint-disable-next-line @typescript-eslint/naming-convention
                var headers : any = { 'Content-Type': 'application/json',       'Authorization': `Bearer ${bearerToken}` };
                
                outputHttpLog(`   POST ${url}`);
                var response = await axios.default.post(url, { }, { headers: headers });
                outputHttpResult(response);

                vscode.window.showInformationMessage(`Customizations published in ${environment.displayName}.`);
            } catch (err: any) {
                vscode.window.showErrorMessage(`Publish Customizations in ${environment.displayName} failed.\n\n${err?.response?.data?.error?.message || err}`);
            }
            return new Promise(resolve=>resolve());
        });        
    }
}