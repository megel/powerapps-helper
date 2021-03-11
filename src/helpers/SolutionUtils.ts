import * as vscode from 'vscode';
import * as uuid from 'uuid';
import * as xml2js from 'xml2js';
import { Settings } from "./Settings";
import { promises as fsPromises } from 'fs'; 
import { Utils } from './Utils';
import { Solution } from '../entities/Solution';
import { CanvasApp } from '../entities/CanvasApp';
import { CloudFlow } from '../entities/CloudFlow';
import { Connector } from '../entities/Connector';
import { APIUtils } from './APIUtils';


export class SolutionUtils {

    /**
     * Unpack the PowerApp
     * @param powerAppFilePath for PowerApp (.msapp file)
     * @param sourceFolder path of unpacked PowerApp sources     
     * @returns success
     */
     static async unpackPowerApp(powerAppFilePath: string, sourceFolder: string, onSuccess?: Action<any> | undefined, onError?: Action<any> | undefined): Promise<boolean> {
        try {
            const fs = require('fs');
            if (! fs.existsSync(`${sourceFolder}`)) {
                fs.mkdirSync(`${sourceFolder}`, { recursive: true });
            }

            if (! await Utils.checkSourceFileUtility()) { return false; }
            const cmd    = `${await Utils.getSourceFileUtility()} -unpack "${powerAppFilePath}" "${sourceFolder}"`;
            return await Utils.executeChildProcess(cmd, onSuccess, onError);
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
    static async packPowerApp(powerAppFilePath: string, sourceFolder: string, onSuccess?: Action<any> | undefined, onError?: Action<any> | undefined): Promise<boolean> {
        if (! await Utils.checkSourceFileUtility()) { return false; }
        const cmd = `${await Utils.getSourceFileUtility()} -pack "${powerAppFilePath}" "${sourceFolder}"`;
        return await Utils.executeChildProcess(cmd, onSuccess, onError);            
    }

    /**
     * Pack the current PowerApp from Workspace
     */
    public static async packWorkspacePowerApp(): Promise<void> {
        let rootPath = vscode.workspace.rootPath;
        if (rootPath === undefined) {
            vscode.window.showErrorMessage('Please open a Folder or Workspace!');
            return;
        }
        const fs  = require("fs");
        var files = await fs.readdirSync(`${rootPath}/${Settings.sourceFolder()}/CanvasApps/`);        
        let items = files.filter((file:string) => file.endsWith('_msapp_src')).map((file: string) => {
            let manifest = require(`${rootPath}/${Settings.sourceFolder()}/CanvasApps/${file}/CanvasManifest.json`);
			return {
				description: `${manifest?.Properties?.Id || ''}`,
				detail:      `.../${Settings.sourceFolder()}/CanvasApps/${file}`,
				label:       manifest?.Properties?.Name || file,
				sourcePath:  `${rootPath}/${Settings.sourceFolder()}/CanvasApps/${file}`,
				isDefault:   false
			};
		}).sort((app1: any, app2: any) => app1.isDefault ? -1 : (app1.label < app2.label ? -1 : 1) );

        let item : any = await vscode.window.showQuickPick(items);
		if (item === undefined) {
			return;
		}
        
        const paPath = `${rootPath}/${Settings.outputFolder()}/${item.label}.msapp`;
        await SolutionUtils.packPowerApp(`${paPath}`, `${item.sourcePath}`);        
    }
    
    /**
     * Get the Workspace Solution information
     * @returns the local solution or undefined
     */
    public static async getWorkspaceSolution() : Promise<any | undefined> {
        let rootPath = vscode.workspace.rootPath;
        if (rootPath === undefined) {
            return undefined;
        }

        var glob = require("glob-promise");
        var files = await glob.promise(`${rootPath}/${Settings.sourceFolder()}/solution.xml`, {});
        if ((files?.length || 0) <= 0) { return undefined; };
        var xml    = (await (await fsPromises.readFile(files[0]))).toString('utf8');
        try {
            var xmlSolution = await new Promise<any>((resolve, reject) => {
                xml2js.parseString(xml, (err: Error, result: any) =>{
                    resolve(result);
                });
            });
            
            return {
                "uniqueName":             xmlSolution?.ImportExportXml?.SolutionManifest[0]?.UniqueName[0],
                "displayName":            xmlSolution?.ImportExportXml?.SolutionManifest[0]?.LocalizedNames[0]?.LocalizedName[0]?.$?.description,
                "version":                xmlSolution?.ImportExportXml?.SolutionManifest[0]?.Version[0],
                "publisher":              xmlSolution?.ImportExportXml?.SolutionManifest[0]?.Publisher[0]?.UniqueName[0],
                "publisherName":          xmlSolution?.ImportExportXml?.SolutionManifest[0]?.Publisher[0]?.LocalizedNames[0]?.LocalizedName[0]?.$?.description,
                "importExportVersion":    xmlSolution?.ImportExportXml?.$?.version,
                "solutionPackageVersion": xmlSolution?.ImportExportXml?.$?.SolutionPackageVersion,
                "rootComponents":         xmlSolution?.ImportExportXml?.SolutionManifest[0]?.RootComponents.map((rootComponent: any): any => {
                    return { "type": rootComponent?.$?.type, "id": rootComponent?.$?.id, "schemaName": rootComponent?.$?.schemaName, "behavior": rootComponent?.$?.behavior};
                })
            };
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
            return undefined;
        }
    }

    /**
     * Get the ParameterXml for PublishXml Action of Crm
     * https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/publishxml?view=dynamics-ce-odata-9
     * @param item Solution, CanvasApp, CloudFlow or Connector
     * @returns the XML that defines which solution components to publish in this request.
     */
    static async getPublishParameter(item: Solution | CanvasApp | CloudFlow | Connector): Promise<string | undefined> {
        var canvasApps : string[]= [];
        var cloudFlows : string[]= [];
        var connectors : string[]= [];
        if (item instanceof Solution) {
            let solutionId = (item as Solution).solutionData?.solutionid;
            if (! solutionId) { return; }
            canvasApps = canvasApps.concat(await APIUtils.getCanvasApps((item as Solution).environment.instanceApiUrl, (data) => data.name, undefined, undefined, undefined, solutionId));
            cloudFlows = cloudFlows.concat(await APIUtils.getCloudFlows((item as Solution).environment.instanceApiUrl, (data) => `WorkflowId="${data.workflowidunique}" Name="${data.name}"`, undefined, undefined, undefined, solutionId));
            connectors = connectors.concat(await APIUtils.getConnectors((item as Solution).environment.instanceApiUrl, (data) => data.name, undefined, undefined, undefined, solutionId));
        } else if (item instanceof CanvasApp) {
            canvasApps.push((item as CanvasApp).name);
        } else if (item instanceof Connector) {
            connectors.push((item as Connector).name);
        } else if (item instanceof CloudFlow) {
            cloudFlows.push(`WorkflowId="${(item as CloudFlow).cloudFlowData.workflowidunique}" Name="${(item as CloudFlow).name}"`);
        } else { return; }
        
        return `<ImportExportXml>` + 
            `<CanvasApps>${canvasApps.map(s => `<CanvasApp><Name>${s}</Name></CanvasApp>`).join("")}</CanvasApps>` + 
            `<Connectors>${connectors.map(s => `<Connector><Name>${s}</Name></Connector>`).join("")}</Connectors>` + 
            `<Workflows>${cloudFlows.map(s => `<Workflow ${s}></Workflow>`).join("")}</Workflows>` +
            `</ImportExportXml>`;
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


}