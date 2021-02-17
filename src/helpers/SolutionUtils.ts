import * as vscode from 'vscode';
import * as uuid from 'uuid';
import * as xml2js from 'xml2js';
import { Settings } from "./Settings";
import { promises as fsPromises } from 'fs'; 
import { Utils } from './Utils';


export class SolutionUtils {

    /**
     * Unpack the PowerApp
     * @param powerAppFilePath for PowerApp (.msapp file)
     * @param sourceFolder path of unpacked PowerApp sources     
     * @returns success
     */
     static async unpackPowerApp(powerAppFilePath: string, sourceFolder: string): Promise<boolean> {
        try {
            const fs = require('fs');
            if (! fs.existsSync(`${sourceFolder}`)) {
                fs.mkdirSync(`${sourceFolder}`, { recursive: true });
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
    static async packPowerApp(powerAppFilePath: string, sourceFolder: string): Promise<boolean> {
        const cmd = `${Settings.sourceFileUtility()} -pack "${powerAppFilePath}" "${sourceFolder}"`;
        return await Utils.executeChildProcess(cmd);            
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