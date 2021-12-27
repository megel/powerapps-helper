import * as vscode from 'vscode';
import * as uuid from 'uuid';
import * as util from 'util';
import * as stream from 'stream';
import * as xml2js from 'xml2js';
import { Settings } from "./Settings";
import { promises as fsPromises } from 'fs'; 
import { Utils } from './Utils';
import { Solution } from '../entities/Solution';
import { CanvasApp } from '../entities/CanvasApp';
import { CloudFlow } from '../entities/CloudFlow';
import { Connector } from '../entities/Connector';
import { APIUtils } from './APIUtils';
import { settings } from 'cluster';
import { PowerApp } from '../entities/PowerApp';


export class SolutionUtils {

    static readonly zipSolutionFileLocation = "solution.xml";
    
    static readonly crmSolutionFileLocation = `other/${SolutionUtils.zipSolutionFileLocation}`;

    static readonly canvasAppManifestLocation = `CanvasManifest.json`;


    /**
     * pack the Solution
     * @param sourceFolder path of unpacked Solution sources
     * @param solutionZip path of the Solution.zip
     * @returns the buffer of the zip
     */
    static async packSolution(sourceFolder: string, solutionZip: string, isManaged: boolean, onSuccess?: Action<any> | undefined, onError?: Action<any> | undefined): Promise<ArrayBuffer | SharedArrayBuffer | undefined> {        
        
        if(Settings.useCrmSolutionPacker()) {
            if (! await Utils.checkPowerPlatformCli()) { return; }
            const cmd  = await Utils.getPowerPlatformCliCommandLine(`solution pack --folder "${sourceFolder}" --zipfile "${solutionZip}" --packagetype ${isManaged ? 'Managed' : 'Unmanaged' }`);
            await Utils.executeChildProcess(cmd, (result) => vscode.window.showInformationMessage(`Solution extracted to: ${sourceFolder}`), onError);
            const fs = require('fs');
            return fs.readFileSync(`${solutionZip}`);
        } else {     
            var zipper = require('zip-local');
            var zipped = zipper.sync.zip(`${sourceFolder}`).compress();
            zipped.save(`${solutionZip}`);
            return zipped.memory();
        }

    }

    /**
     * pack the Solution
     * @param sourceFolder path of unpacked Solution sources     
     * @param solutionZip path of the Solution.zip 
     * @returns success
     */
    static async unpackSolution(solutionFolder: string, solutionZip: string, onSuccess?: Action<any> | undefined, onError?: Action<any> | undefined): Promise<void> {
        
        if(Settings.useCrmSolutionPacker()) {
            if (! await Utils.checkPowerPlatformCli()) { return; }
            const cmd  = await Utils.getPowerPlatformCliCommandLine(`solution unpack --folder "${solutionFolder}" --zipfile "${solutionZip}" --allowDelete true`);
            await Utils.executeChildProcess(cmd, (message) => vscode.window.showInformationMessage(`Solution unpacked to: ${solutionZip}`), onError);            
        } else {
            const fs = require('fs');
            const unzip = require('unzipper');
            var zip = fs.createReadStream(solutionZip);                
            const finished = util.promisify(stream.finished);
            await zip.pipe(unzip.Extract({ path: `${solutionFolder}`, concurrency: 5 }));
            //var result = await new Promise((resolve, reject) => {zip.on('close', function () {resolve(true);}); zip.on('error', () => { reject(false); }); } );
            await finished(zip);
            await new Promise( resolve => setTimeout(resolve, 2000) ); // UNZIP must be really finished
        }

    }

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

            if (! await Utils.checkPowerPlatformCli()) { return false; }
            const cmd    = await Utils.getPowerPlatformCliCommandLine(`canvas unpack --msapp "${powerAppFilePath}" --sources "${sourceFolder}"`);
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
        if (! await Utils.checkPowerPlatformCli()) { return false; }
        const cmd    = await Utils.getPowerPlatformCliCommandLine(`canvas pack --msapp "${powerAppFilePath}" --sources "${sourceFolder}"`);
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
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Pack workspace Power App`,
            cancellable: false
        }, async (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined; }>, token: vscode.CancellationToken): Promise<void> => {
            var localPowerApp = await SolutionUtils.getWorkspacePowerAppManifest();
            if (! localPowerApp) { return; }
            var envPowerApp: PowerApp | undefined = undefined;
            try {      
                // Select PowerApp on a Multi-PowerApp Workspace
                const sourceFolder = localPowerApp?.powerAppPath ?? await SolutionUtils.getWorkspacePowerAppPath(localPowerApp?.uniqueName);
                if (! sourceFolder) { return; }
                const targetFolder = `${rootPath}/${Settings.outputFolder()}`;
                        
                const paPath = `${targetFolder}/${localPowerApp.appName}.msapp`;
                await SolutionUtils.packPowerApp(`${paPath}`, `${sourceFolder}`);   

            } catch (err: any) {
                vscode.window.showErrorMessage(`${err}`);
            }
            return new Promise(resolve=>resolve());
        });
    }

    /**
     * Get or Select the PowerApp Path (Managed outside of a solution)
     * @param solutionName is the name of the solution
     * @returns true, if the solution.xml exist underneath Other/solution.xml
     */
     public static async getWorkspacePowerAppPath(powerAppName?: string) : Promise<string | undefined> {

        const rePowerAppName = /<PowerAppName>/gi;
        const reSourceFolder = /<SourceFolder>/gi;        
        const powerAppPath   = `${Settings.sourceFolder()}/<PowerAppName>`.replace(reSourceFolder, Settings.sourceFolder());
        const defaultDir     = `${vscode.workspace.rootPath}/${Settings.sourceFolder()}`;
        if (! powerAppName) {            
            var powerApps = [];
            for await (const powerApp of await SolutionUtils.getWorkspacePowerApps() )
            {
                powerApps.push({
                    label:        `${powerApp.displayName}`,
                    isDefault:    false,
                    description:  powerApp.description,
                    detail:       powerApp.powerAppPath,
                    powerAppName: `${powerApp.appName}`,
                    powerApp:     powerApp });
            }
            
            let item = await vscode.window.showQuickPick(powerApps);
            if (item) {
                return item.powerApp.powerAppPath;
            }
            
            vscode.window.showWarningMessage(`No PowerApp found in: ${defaultDir}`);
            return undefined;
        }
        return `${vscode.workspace.rootPath}/${powerAppPath.replace(rePowerAppName, powerAppName)}/`;
     }

    /**
     * Get all workspace PowerApps (managed outside from solutions)
     * @returns all workspace PowerApps
     */
    public static async getWorkspacePowerApps() : Promise<any[]> {
        const fs         = require('fs');
        const path       = require('path');
        const defaultDir = `${vscode.workspace.rootPath}/${Settings.sourceFolder()}`;

        var powerApps : any [] = [];
        var folders = [`${defaultDir}`];
        if (! fs.existsSync(`${defaultDir}`)) {
            fs.mkdirSync(`${defaultDir}`, { recursive: true });
        }
        fs.readdirSync(`${defaultDir}`).forEach((name : string) => folders.push(path.resolve(`${defaultDir}/${name}`)));
        
        for await (const folder of folders) {
            if (fs.existsSync(`${folder}/${SolutionUtils.canvasAppManifestLocation}`)) {
                try {
                    powerApps.push(await SolutionUtils.getWorkspacePowerAppManifest(folder));
                } catch {}
            }
        }
        return powerApps;
    }

    /**
     * Get the Workspace Power App information
     * @returns the local Power App or undefined
     */
     public static async getWorkspacePowerAppManifest(powerAppPath?: string) : Promise<any | undefined> {
        let rootPath = vscode.workspace.rootPath;
        if (rootPath === undefined) {
            return undefined;
        }

        powerAppPath = powerAppPath ?? await this.getWorkspacePowerAppPath();
        if (! powerAppPath) { return; }
        const fs           = require('fs');
        var powerAppFile   = `${powerAppPath}/${SolutionUtils.canvasAppManifestLocation}`;
        if (! fs.existsSync(`${powerAppFile}`)) { throw new Error(`Canvas App Manifest file "${powerAppFile}" not found.`); }
        
        var glob = require("glob-promise");
        var files = await glob.promise(powerAppFile, {});
        if ((files?.length || 0) <= 0) { return undefined; };
        const content = fs.readFileSync(files[0], 'utf8');
        var jsonData = JSON.parse(content);
        try {
            return {
                "formatVersion":          jsonData?.FormatVersion,
                "appCreationSource":      jsonData?.Properties?.AppCreationSource,
                "description":            jsonData?.Properties?.AppDescription,
                "id":                     jsonData?.Properties?.Id,
                "fileID":                 jsonData?.Properties?.FileId,
                "displayName":            jsonData?.Properties?.Name,
                "author":                 jsonData?.Properties?.Author,
                "appName":                jsonData?.PublishInfo?.AppName,
                "powerAppPath":           powerAppPath
            };
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
            return undefined;
        }
    }
    
    /**
     * Get the Workspace Solution information
     * @returns the local solution or undefined
     */
    public static async getWorkspaceSolution(isCrmSolution?: boolean, solutionPath?: string) : Promise<any | undefined> {
        let rootPath = vscode.workspace.rootPath;
        if (rootPath === undefined) {
            return undefined;
        }

        solutionPath = solutionPath ?? await this.getWorkspaceSolutionPath();
        if (! solutionPath) { return undefined; }
        const fs           = require('fs');
        var solutionFile   = isCrmSolution ?? SolutionUtils.isCrmSolution(solutionPath) ? `${solutionPath}/${SolutionUtils.crmSolutionFileLocation}` : `${solutionPath}/${SolutionUtils.zipSolutionFileLocation}`;
        if (! fs.existsSync(`${solutionFile}`)) { throw new Error(`Solution file "${solutionFile}" not found.`); }
        
        var glob = require("glob-promise");
        var files = await glob.promise(solutionFile, {});
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
                "managed":                xmlSolution?.ImportExportXml?.SolutionManifest[0]?.Managed[0],
                "publisher":              xmlSolution?.ImportExportXml?.SolutionManifest[0]?.Publisher[0]?.UniqueName[0],
                "publisherName":          xmlSolution?.ImportExportXml?.SolutionManifest[0]?.Publisher[0]?.LocalizedNames[0]?.LocalizedName[0]?.$?.description,
                "importExportVersion":    xmlSolution?.ImportExportXml?.$?.version,
                "solutionPackageVersion": xmlSolution?.ImportExportXml?.$?.SolutionPackageVersion,
                "rootComponents":         xmlSolution?.ImportExportXml?.SolutionManifest[0]?.RootComponents.map((rootComponent: any): any => {
                    return { "type": rootComponent?.$?.type, "id": rootComponent?.$?.id, "schemaName": rootComponent?.$?.schemaName, "behavior": rootComponent?.$?.behavior};
                }),
                "solutionPath":           solutionPath
            };
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
            return undefined;
        }
    }

    /**
     * Get or Select the Solution Path
     * @param solutionName is the name of the solution
     * @returns true, if the solution.xml exist underneath Other/solution.xml
     */
     public static async getWorkspaceSolutionPath(solutionName?: string) : Promise<string | undefined> {

        const reSolutionName = /<SolutionName>/gi;
        const reSourceFolder = /<SourceFolder>/gi;        
        const solutionPath   = `${Settings.solutionFolderName()}`.replace(reSourceFolder, Settings.sourceFolder());
        const defaultDir     = `${vscode.workspace.rootPath}/${Settings.sourceFolder()}`;
        if (! solutionName) {            
            var solutions = [];
            for await (const solution of await SolutionUtils.getWorkspaceSolutions() )
            {
                solutions.push({
                    label:        `${solution.displayName}`,
                    isDefault:    false,
                    description:  solution.description,
                    detail:       solution.solutionPath,
                    solutionName: `${solution.name}`,
                    solution: solution });
            }
            
            let item = await vscode.window.showQuickPick(solutions);
            if (item) {
                return item.solution.solutionPath;
            }
            vscode.window.showWarningMessage(`No solution found in: ${defaultDir}`);
            return undefined;            
        }
        return `${vscode.workspace.rootPath}/${solutionPath.replace(reSolutionName, solutionName)}/`;
     }

    /**
     * Get all workspace solutions
     * @returns all workspace solutions
     */
    public static async getWorkspaceSolutions() : Promise<any[]> {
        const fs         = require('fs');
        const path       = require('path');
        const defaultDir = `${vscode.workspace.rootPath}/${Settings.sourceFolder()}`;
        
        var solutions : any [] = [];
        var folders = [`${defaultDir}`];
        if (! fs.existsSync(`${defaultDir}`)) {
            fs.mkdirSync(`${defaultDir}`, { recursive: true });
        }
        fs.readdirSync(`${defaultDir}`).forEach((name : string) => folders.push(path.resolve(`${defaultDir}/${name}`)));
        
        for await (const folder of folders) {
            if (fs.existsSync(`${folder}/${SolutionUtils.zipSolutionFileLocation}`) 
             || fs.existsSync(`${folder}/${SolutionUtils.crmSolutionFileLocation}`)) {
                try {
                    solutions.push(await SolutionUtils.getWorkspaceSolution(undefined, folder));
                } catch {}
            }
        }
        return solutions;
    }

    /**
     * Check, if the Solution is a CrmSolution
     * @param solutionPath the path to solution folder
     * @returns true, if the solution.xml exist underneath Other/solution.xml
     */
     public static async isCrmSolution(solutionPath: string) : Promise<boolean> {
        const fs           = require('fs');
        return fs.existsSync(`${solutionPath}/${SolutionUtils.crmSolutionFileLocation}`);
     }

    /**
     * Update the Solution manifest (solution.xml)
     * @param solutionPath the path to solution.xml 
     * @param version ... new solution version
     * @param isManaged ... managed or unmanaged solution     
     */
    public static async updateSolution(solutionPath: string, version: string, isManaged: boolean, isCrmSolution?: boolean) : Promise<void> {
        try {
            const fs           = require('fs');
            var solutionFile = isCrmSolution ?? SolutionUtils.isCrmSolution(solutionPath) ? `${solutionPath}/${SolutionUtils.crmSolutionFileLocation}` : `${solutionPath}/${SolutionUtils.zipSolutionFileLocation}`;
            if (! fs.existsSync(`${solutionFile}`)) { throw new Error(`SOlution file "${solutionFile}" not found.`); }
            var xmlContent   = (await (await fsPromises.readFile(solutionFile))).toString('utf8');
            var xmlSolution  = await new Promise<any>((resolve, reject) => {
                xml2js.parseString(xmlContent, (err: Error, result: any) =>{
                    resolve(result);
                });
            });

            xmlSolution.ImportExportXml.SolutionManifest[0].Version[0] = version;
            xmlSolution.ImportExportXml.SolutionManifest[0].Managed[0] = (isManaged ? 1 : 0);
            const builder = new xml2js.Builder();
            xmlContent = builder.buildObject(xmlSolution);

            // write updated XML string to a file
            await fsPromises.writeFile(`${solutionFile}`, xmlContent, {encoding: 'utf8'});
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
            return;
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
