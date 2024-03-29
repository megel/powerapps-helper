import * as vscode from 'vscode';
import * as axios from 'axios';
import * as path from 'path';
import * as os from 'os';
import { Settings } from "./Settings";
import { promises as fsPromises } from 'fs'; 
import { getOutputChannel, outputHttpLog, outputHttpResult } from '../extension';
import { env } from 'process';
import { IPacInterop, IPacWrapperContext, PacWrapper } from '../pac/PacWrapper';
export class Utils {
    static _pacContext:   IPacWrapperContext;
    static _pacInterop:   IPacInterop;
	static _pacWrapper:   PacWrapper;
	static _cliPath:      string;
	static _cliToolsPath: string;
    
    static async register(pacContext: IPacWrapperContext, pacInterop: IPacInterop, pacWrapper: PacWrapper, cliPath: string, pacCliPath: string): Promise<void> {
		Utils._pacContext   = pacContext;
        Utils._pacInterop   = pacInterop;
	    Utils._pacWrapper   = pacWrapper;
	    Utils._cliPath      = cliPath;
	    Utils._cliToolsPath = pacCliPath;
	}

    private static getPacExecutableName(): string {
        const platformName = os.platform();
        switch (platformName) {
            case 'win32':
                return 'pac.exe';
            case 'darwin':
                return 'pac.dll';
            case 'linux':
                return 'pac';
            default:
                throw new Error(`Unsupported OS platform for pac CLI: ${platformName}`);
        }
    }

    public static get cliExePath(): string {
        const execName = Utils.getPacExecutableName();
        return path.join(Utils._cliPath, 'tools', execName);
    }
	
    static async postWithReturnArray<T>(url: string, convert: (ti: any) => T, sort: ((t1: T, t2: T) => number) | undefined, filter: ((t1: T) => boolean) | undefined, content: any | undefined, contentType: string | undefined, bearerToken? : string | undefined): Promise<T[]> {
        var headers:any = contentType !== undefined ? {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': contentType
        } : { };
        if (bearerToken !== undefined) {
            headers.Authorization = `Bearer ${bearerToken}`;
        }

        outputHttpLog(`    GET ${url}`);
        var response = await axios.default.post(url, content, {
            headers: headers
        });
        outputHttpResult(response);

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

    static async getWithReturnArray<T>(url: string, convert: (ti: any) => T, sort: ((t1: T, t2: T) => number) | undefined, filter: ((t1: T) => boolean) | undefined, bearerToken? : string | undefined): Promise<T[]> {
        var headers:any = { };
        if (bearerToken !== undefined) {
            headers.Authorization = `Bearer ${bearerToken}`;
        }
        
        outputHttpLog(`    GET ${url}`);
        var response = await axios.default.get(url,{
            headers: headers
        });
        outputHttpResult(response);
        
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

    static async getWithReturnSingle<T>(url: string, convert: (ti: any) => T, bearerToken? : string | undefined): Promise<T | undefined> {
        var headers:any = { };
        if (bearerToken !== undefined) {
            headers.Authorization = `Bearer ${bearerToken}`;
        }
        var response = await axios.default.get(url,{
            headers: headers
        });
        return response.data !== undefined ? convert(response.data) : undefined;
    }

    static async prettifyJson(sourcePath: string, targetPath: string): Promise<boolean> {
        try {
            const fs = require('fs');
            const stringify = require('json-stable-stringify');
            if (! fs.existsSync(`${targetPath}`)) {
                fs.mkdirSync(`${targetPath}`, { recursive: true });
            }

            const content = fs.readFileSync(sourcePath, 'utf8');
            var jsonData = JSON.parse(content);
            if (jsonData) {
                fs.writeFileSync(targetPath, stringify(jsonData, { space: ''.padEnd(4, ' ') }), function (err: any) {
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

    static async minifyJson(sourcePath: string, targetPath: string): Promise<boolean> {
        try {
            const fs = require('fs');
            if (! fs.existsSync(`${targetPath}`)) {
                fs.mkdirSync(`${targetPath}`, { recursive: true });
            }

            var jsonData = require(sourcePath);
            if (jsonData) {
                fs.writeFile(targetPath, JSON.stringify(jsonData), function (err: any) {
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
    
    static async prettifyXml(sourcePath: string, targetPath: string): Promise<boolean> {
        try {
            const fs = require('fs');
            if (! fs.existsSync(`${targetPath}`)) {
                fs.mkdirSync(`${targetPath}`, { recursive: true });
            }
            
            var xml    = (await (await fsPromises.readFile(sourcePath))).toString('utf8');
            var format = require('xml-formatter');
            var formattedXml = format(xml);
            fs.writeFile(targetPath, formattedXml, function (err: any) {
                if (err) {
                    vscode.window.showErrorMessage(`${err}`);
                }
            });
            // xml2js.parseString(data, (err: Error, result: any) =>{
            //     vscode.window.showInformationMessage(`${result}`);
            // });
            return true;
        } catch (err) {
            vscode.window.showErrorMessage(`${err}`);
            return false;
        }
    }

    static async executeChildProcess(cmd: string, onSuccess?: Action<any> | undefined, onError?: Action<any> | undefined, workingDirectory?: string): Promise<boolean> {
        try {
            getOutputChannel().show(true);
            getOutputChannel().append(`\n\nRUN: ${cmd}\n`);
                        
            const result = await new Promise((resolve, reject) => {
                const cp     = require('child_process');
                cp.exec(cmd, {cwd: workingDirectory, env: env}, (error: any, stdout: string, stderr: string) => {
                    if (error) {
                        getOutputChannel().append(`${error}\n`);
                        reject(error);
                    } else {
                        getOutputChannel().append(`${stdout}\n`);
                        resolve(stdout); 
                    }
                });
            });
            if (result) {
                (onSuccess ?? Utils.onSuccess)(result);
            }            
            return true;
        } catch (err: any) {
            (onError ??  Utils.onError)(err);
            return false;
        }
    }

    /**
     * Copy a complete folder recursive like cp -R.
     * @param {string} src  The path to the thing to copy.
     * @param {string} dest The path to the new copy.
     */
    static async copyRecursive(sourceFolder: string, targetFolder: string): Promise<void> {
        const fs = require('fs');
        const path = require("path");

        var copyRecursiveSync = function(src:string, dest:string) {
            var exists = fs.existsSync(src);
            var stats = exists && fs.statSync(src);
            var isDirectory = exists && stats.isDirectory();
            if (isDirectory) {
            fs.mkdirSync(dest);
            fs.readdirSync(src).forEach(function(childItemName:any) {
                copyRecursiveSync(path.join(src, childItemName),
            path.join(dest, childItemName));
            });
            } else {
                fs.copyFileSync(src, dest);
            }
        };
        await copyRecursiveSync(sourceFolder, targetFolder);
    } 
    
    static async getToolsCommandLine(binPath: string, args?: string): Promise<string> {
        const os = require('os');
        const fs = require('fs');
        if (fs.existsSync(binPath) && `${os.platform}`.toLowerCase() !== "win32") {
            const cp     = require('child_process');
            try {
                await new Promise((resolve, reject) => { cp.exec(`chmod 755 ${binPath}`, (error: any, stdout: string, stderr: string) => { if (error) { reject(error); } else { resolve(stdout);}});});
            } catch {}
        }

        switch (`${os.platform}`.toLowerCase()) {
            case "darwin":
            case "macos": return `dotnet ${binPath} ${args}`;
        }

        return `${binPath} ${args}`;
    }

    static async getPowerPlatformCliCommandLine(args?: string): Promise<string> {
        return await this.getToolsCommandLine(await Utils.getPowerPlatformCliPath(), args ?? "");    
    }

    static async getPowerPlatformCliPath(): Promise<string> {
        return `"${Settings.powerPlatformCli()}"`;
    }

    /**
     * Check the (Power Platform Cli) for Pack & Unpack PowerApps.
     * @returns success
     */
     static async checkPowerPlatformCli(): Promise<boolean> {
		const cmd = await Utils.getPowerPlatformCliCommandLine();
        var success = await Utils.executeChildProcess(cmd, () => {}, () => {}, path.dirname(Utils.cliExePath));
        if (success) {
            return true;
        } else {
            vscode.window.showErrorMessage(new vscode.MarkdownString(`The Power Apps Cli '${cmd}' was not found. Please download, compile and setup the tool from https://aka.ms/PowerAppsCLI`).value);
            return false;
        }
	}


    /**
     * Clear the credential cache for this extension.
     */
    static async clearCredentialCache() {
        try {
            const keytar  = require('keytar');
            const service = 'mme2k-powerapps-helper';
            const credentials = (await keytar.findCredentials(service));
            
            await credentials.forEach(async function(credential:any) {
                await keytar.deletePassword(service, credential.account);
            });
        } catch {}
    }

    static onSuccess(result: any) {
        vscode.window.showInformationMessage(`${result}`);
    }

    static onError(err: any) {
        vscode.window.showErrorMessage(`${err}`);
    }
}