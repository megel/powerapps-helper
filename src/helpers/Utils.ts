import * as vscode from 'vscode';
import * as axios from 'axios';
import * as uuid from 'uuid';
import * as util from 'util';
import * as stream from 'stream';
import { Settings } from "./Settings";
import { OAuthUtils } from "./OAuthUtils";
import { PowerApp } from '../entities/PowerApp';
import { PowerAppVersion } from '../entities/PowerAppVersion';

export class Utils {

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
            const cp = require('child_process');
            await cp.exec(cmd, (err:any, stdout:any, stderr:any) => {
                if (stderr !== undefined) {
                    vscode.window.showInformationMessage(`${stdout}`);
                }
                if (stderr !== undefined) {
                    vscode.window.showErrorMessage(`${stderr}`);
                }
                if (err) {
                    vscode.window.showErrorMessage(`${err}`);
                }

                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    vscode.window.showErrorMessage(`${err}`);
                }
            });            
            
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
     * Pack the current PowerApp from Workspace
     */
    public static async packWorkspacePowerApp(): Promise<void> {
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
            const cp = require('child_process');
            await cp.exec(cmd, (err:any, stdout:any, stderr:any) => {
                if (stderr !== undefined) {
                    vscode.window.showInformationMessage(`${stdout}`);
                }
                if (stderr !== undefined) {
                    vscode.window.showErrorMessage(`${stderr}`);
                }
                if (err) {
                    vscode.window.showErrorMessage(`${err}`);
                }
            });            
            
        } catch (err: any) {
            vscode.window.showErrorMessage(`${err}`);
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