import * as vscode from 'vscode';
import * as axios from 'axios';
import * as uuid from 'uuid';
import * as util from 'util';
import * as stream from 'stream';
import { Settings } from "./Settings";
import { OAuthUtils } from "./OAuthUtils";
import { PowerApp } from '../entities/PowerApp';
import {Environment} from '../entities/Environment';
import { PowerAppVersion } from '../entities/PowerAppVersion';
import { Solution } from '../entities/Solution';
import { utils } from 'mocha';
import { SolutionComponent } from '../entities/SolutionComponent';
import { ComponentType } from '../entities/ComponentType';

export class Utils {

    /**
     * Get the Environments from API (https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-environments)
     * @param app (mandatory) - The PowerApp name
     * @param convert - callback to convert the results to a PowerAppVersions
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     */
    public static async getEnvironments(
        convert: (ti: any) => Environment, 
        sort: ((t1: Environment, t2: Environment) => number) | undefined, 
        filter: ((t1: Environment) => boolean) | undefined) : Promise<Environment[]>
    {
        var url = "https://api.powerapps.com/providers/Microsoft.PowerApps/environments/?api-version=2020-07-01";
        return await Utils.getWithReturnArray<Environment>(url, convert, sort, filter, await OAuthUtils.getPowerAppAPIToken());
    }

    /**
     * Get the PowerApps from API (https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-apps)
     * @param app (mandatory) - The PowerApp name
     * @param convert - callback to convert the results to a PowerAppVersions
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     */
    public static async getPowerApps(
        convert: (ti: any) => PowerApp, 
        sort: ((t1: PowerApp, t2: PowerApp) => number) | undefined, 
        filter: ((t1: PowerApp) => boolean) | undefined) : Promise<PowerApp[]>
    {
        var url = "https://api.powerapps.com/providers/Microsoft.PowerApps/apps/?api-version=2020-07-01&$expand=unpublishedAppDefinition";
        return await Utils.getWithReturnArray<PowerApp>(url, convert, sort, filter, await OAuthUtils.getPowerAppAPIToken());
    }

    /**
     * Get the Versions of a PowerApp from API (https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-app-versions)
     * @param app (mandatory) - The PowerApp name
     * @param convert - callback to convert the results to a PowerAppVersions
     * @param sort - callback to sort results
     * @param filter - callback to filter results
     */
    public static async getPowerAppVersions(
        app: string,
        convert: (ti: any) => PowerAppVersion, 
        sort: ((t1: PowerAppVersion, t2: PowerAppVersion) => number) | undefined, 
        filter: ((t1: PowerAppVersion) => boolean) | undefined) : Promise<PowerAppVersion[]>
    {
        var url = `https://api.powerapps.com/providers/Microsoft.PowerApps/apps/${app}/versions?api-version=2020-07-01`;
        return await Utils.getWithReturnArray<PowerAppVersion>(url, convert, sort, filter, await OAuthUtils.getPowerAppAPIToken());
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
            var flowComponents = await Utils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.customConnector);
            if (flowComponents.length > 0) {
                filters.push(flowComponents.map(component => `(connectorid eq ${component.objectId})`).join(' or '));
            }
            var flowComponents = await Utils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.connector);
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
            const flowComponents = await Utils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.workFlow);
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
            const flowComponents = await Utils.getSolutionComponents(uri, SolutionComponent.convert, undefined, undefined, undefined, solutionId, ComponentType.canvasApp);
            if (flowComponents.length <= 0) {
                return [];
            }
            filters.push(flowComponents.map(component => `(canvasappid eq ${component.objectId})`).join(' or '));
        }
        var url = `${uri}/api/data/v9.1/canvasapps${filters.length > 0 ? '?$filter=' + encodeURI(filters.join(' and ')): ''}`;
        return await Utils.getWithReturnArray<T>(url, convert, sort, filter, bearerToken || await OAuthUtils.getCrmToken(uri));
    }

    /**
     * Get the Solution Components from Dynamics 365 API (https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/workflow)
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
    







    
    private static async postWithReturnArray<T>(url: string, convert: (ti: any) => T, sort: ((t1: T, t2: T) => number) | undefined, filter: ((t1: T) => boolean) | undefined, content: any | undefined, contentType: string | undefined, bearerToken? : string | undefined): Promise<T[]> {
        var headers:any = contentType !== undefined ? {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': contentType
        } : { };
        if (bearerToken !== undefined) {
            headers.Authorization = `Bearer ${bearerToken}`;
        }
        var response = await axios.default.post(url, content, {
            headers: headers
        });
        var tis = [];
        if (response.data.value === undefined) {
            tis = response.data
                ? response.data.map((ti: any) => convert(ti))
                : [];
        } else {
            tis = response.data.value
                ? response.data.value.map((ti: any) => convert(ti))
                : [];
        }
        if (filter !== undefined) {
            tis = tis.filter(filter);
        }
        if (sort !== undefined) {
            return tis.sort(sort);
        } else {
            return tis;
        }
    }

    private static async getWithReturnArray<T>(url: string, convert: (ti: any) => T, sort: ((t1: T, t2: T) => number) | undefined, filter: ((t1: T) => boolean) | undefined, bearerToken? : string | undefined): Promise<T[]> {
        var headers:any = { };
        if (bearerToken !== undefined) {
            headers.Authorization = `Bearer ${bearerToken}`;
        }
        var response = await axios.default.get(url,{
            headers: headers
        });
        var tis = [];
        if (response.data.value === undefined) {
            tis = response.data
                ? response.data.map((ti: any) => convert(ti))
                : [];
        } else {
            tis = response.data.value
                ? response.data.value.map((ti: any) => convert(ti))
                : [];
        }
        if (filter !== undefined) {
            tis = tis.filter(filter);
        }
        if (sort !== undefined) {
            return tis.sort(sort);
        } else {
            return tis;
        }
    }

    /**
     * Download and Unpack a PowerApp
     * @param app - The PowerApp to download
     */
    public static async downloadAndUnpackPowerApp(app: PowerApp): Promise<void> {
        const id: string = uuid.v4();
        const fs = require('fs');
        let path = vscode.workspace.rootPath;
        if (path === undefined) {
            vscode.window.showErrorMessage('Please open a Folder or Workspace!');
            return;
        } 
        const filePath = `${path}/${id}.msapp`;
        try {
            const file: NodeJS.WritableStream = fs.createWriteStream(filePath);
            const response = await axios.default.get(app.downloadUrl, {responseType: 'stream'});
            
            const finished = util.promisify(stream.finished);            
            await response.data.pipe(file);
            await finished(file);
            await file.end();

            const cmd = `${Settings.sourceFileUtility()} -unpack "${filePath}" "${path}/${Settings.sourceFolder()}"`;
            await Utils.executeChildProcess(cmd);

            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                vscode.window.showErrorMessage(`${err}`);
            }
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
        } finally {
            const dirName  = `${path}/.powerapps`;
            const paPath   = `${dirName}/powerapp.json`;
            const paManifest = {
                id:          app.id,
                name:        app.name,
                displayName: app.displayName,
                downloadUrl: app.downloadUrl
            };

            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName);
            }

            fs.writeFile(paPath, JSON.stringify(paManifest), function (err: any) {
                if (err) {
                    vscode.window.showErrorMessage(`PowerApp ${err}`);
                }
            });
        }
    }

    /**
     * Download and Unpack a Solution
     * @param solution - The Solution to download
     */
    public static async downloadAndUnpackSolution(solution: Solution): Promise<void> {
        const id: string = uuid.v4();
        const fs = require('fs');
        const unzip = require('unzip-stream');
        let path = vscode.workspace.rootPath;
        if (path === undefined) {
            vscode.window.showErrorMessage('Please open a Folder or Workspace!');
            return;
        } 
        const filePath = `${path}/${id}.zip`;

        try {
            vscode.window.showInformationMessage(`Start downloading solution ${solution.name} from ${solution.environment.name}`);
            const bearerToken = await OAuthUtils.getCrmToken(solution.environment.instanceApiUrl);
            const url         = `${solution.environment.instanceApiUrl}/api/data/v9.1/ExportSolution`;
            // eslint-disable-next-line @typescript-eslint/naming-convention
            var headers : any = { 'Content-Type': 'application/json',       'Authorization': `Bearer ${bearerToken}` };
            // eslint-disable-next-line @typescript-eslint/naming-convention
            var data    : any = { 'SolutionName': `${solution.uniqueName}`, 'Managed':       solution.isManaged };
            var response = await axios.default.post(url, data, {
                headers: headers
            });
            
            const file: NodeJS.WritableStream = fs.createWriteStream(filePath);
            const bytes    = Buffer.from(response.data.ExportSolutionFile, 'base64');
            
            await file.write(bytes);
            await file.end();
            
            var zip = fs.createReadStream(filePath);
            const finished = util.promisify(stream.finished);            
            await zip.pipe(unzip.Extract({ path: `${path}/${Settings.sourceFolder()}` }));
            await finished(zip);
            
            var glob = require("glob");

            await glob(`${path}/${Settings.sourceFolder()}/**/*.json`, {}, function (er:any, files:any) {
                files.forEach(async (filename: string) => {
                    await Utils.prettifyJson(filename, filename);
                });
            });

            await glob(`${path}/${Settings.sourceFolder()}/**/*.msapp`, {}, function (er:any, files:any) {
                files.forEach(async (filename: string) => {
                    const unpackedPath = `${filename}`.replace(".msapp", "_msapp_src");
                    var   result       = await Utils.unpackPowerApp(filename, unpackedPath);
                    if (result) 
                    {
                        fs.unlinkSync(filename);
                    }
                });
            });

            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                vscode.window.showErrorMessage(`${err}`);
            }

            vscode.window.showInformationMessage(`Solution ${solution.name} downloaded.`);            
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
        }
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
     */
    public static async packWorkspaceSolution(): Promise<void> {
        const fs = require('fs');
        let path = vscode.workspace.rootPath;
        if (path === undefined) {
            vscode.window.showErrorMessage('Please open a Folder or Workspace!');
            return;
        }
        var paName = "app";
        try {
            const dirName  = `${path}/.powerapps`;
            const paPath   = `${dirName}/powerapp.json`;
            var   powerApp = require(paPath); 
            paName = `${powerApp.displayName}-${Date.now().toString()}`;
        } catch {
            return;
        }
                
        const paPath = `${path}/${Settings.outputFolder()}/${paName}.msapp`;
        try {            
            if (!fs.existsSync(`${path}/${Settings.outputFolder()}`)) {
                fs.mkdirSync(`${path}/${Settings.outputFolder()}`);
            }

            const cmd = `${Settings.sourceFileUtility()} -pack "${paPath}" "${path}/${Settings.sourceFolder()}"`;
            await Utils.executeChildProcess(cmd);
            
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
        }
    }

    private static async prettifyJson(sourcePath: string, targetPath: string): Promise<boolean> {
        try {
            const fs = require('fs');
            if (! fs.existsSync(`${targetPath}`)) {
                fs.mkdirSync(`${targetPath}`);
            }

            var jsonData = require(sourcePath);
            if (jsonData) {
                fs.writeFile(targetPath, JSON.stringify(jsonData, null, 4), function (err: any) {
                    if (err) {
                        vscode.window.showErrorMessage(`${err}`);
                    }
                });
            }

            return true;
        } catch (err) {
            vscode.window.showErrorMessage(`${err}`);
            return false;
        }
    }


    


    /**
     * Unpack the PowerApp
     * @param powerAppFilePath for PowerApp (.msapp file)
     * @param sourceFolder path of unpacked PowerApp sources     
     * @returns success
     */
     private static async unpackPowerApp(powerAppFilePath: string, sourceFolder: string): Promise<boolean> {
        try {
            const fs = require('fs');
            if (! fs.existsSync(`${sourceFolder}`)) {
                fs.mkdirSync(`${sourceFolder}`);
            }

            const cmd    = `${Settings.sourceFileUtility()} -unpack "${powerAppFilePath}" "${sourceFolder}"`;
            return await Utils.executeChildProcess(cmd);
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
            return false;
        }
    }

    /**
     * Pack the PowerApp
     * @param powerAppFilePath for PowerApp (.msapp file)
     * @param sourceFolder path of unpacked PowerApp sources
     * @returns success
     */
    private static async packPowerApp(powerAppFilePath: string, sourceFolder: string): Promise<boolean> {
        const cmd = `${Settings.sourceFileUtility()} -pack "${powerAppFilePath}" "${sourceFolder}"`;
        return await Utils.executeChildProcess(cmd);            
    }

    /**
     * Pack the current PowerApp from Workspace
     */
    public static async packWorkspacePowerApp(): Promise<void> {
        let path = vscode.workspace.rootPath;
        if (path === undefined) {
            vscode.window.showErrorMessage('Please open a Folder or Workspace!');
            return;
        }
        var paName = "app";
        try {
            const dirName  = `${path}/.powerapps`;
            const paPath   = `${dirName}/powerapp.json`;
            var   powerApp = require(paPath); 
            paName = `${powerApp.displayName}-${Date.now().toString()}`;
            
            const fs = require('fs');
            if (!fs.existsSync(`${path}/${Settings.outputFolder()}`)) {
                fs.mkdirSync(`${path}/${Settings.outputFolder()}`);
            }
        } catch {
            return;
        }
        
        const paPath = `${path}/${Settings.outputFolder()}/${paName}.msapp`;
        await Utils.packPowerApp(`${paPath}`, `${path}/${Settings.sourceFolder()}`);        
    }
    
    

    public static async getWorkspaceAppId() : Promise<string | undefined> {
        let path = vscode.workspace.rootPath;
        if (path === undefined) {
            return undefined;
        }
        try {
            const dirName  = `${path}/.powerapps`;
            const paPath   = `${dirName}/powerapp.json`;
            var   powerApp = require(paPath); 
            return `${powerApp.id}`;
        } catch {
            return undefined;
        }
    }

    /**
     * Execute a command in a child process.
     * @param cmd the commandline
     * @returns success
     */
    private static async executeChildProcess(cmd: string): Promise<boolean> {
        try {
            const result = await new Promise((resolve, reject) => {
                const cp     = require('child_process');
                cp.exec(cmd, (error: any, stdout: string, stderr: string) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(stdout); 
                    }
                });
            });
            if (result) {
                vscode.window.showInformationMessage(`${result}`);
            }            
            return true;
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
            return false;
        }
    }
}