import * as vscode from 'vscode';
import * as axios from 'axios';
import * as uuid from 'uuid';
import * as util from 'util';
import * as stream from 'stream';
import * as xml2js from 'xml2js';
import * as path from 'path';
import { Settings } from "./Settings";
import { OAuthUtils } from "./OAuthUtils";
import { PowerApp } from '../entities/PowerApp';
import {Environment} from '../entities/Environment';
import { PowerAppVersion } from '../entities/PowerAppVersion';
import { Solution } from '../entities/Solution';
import { utils } from 'mocha';
import { SolutionComponent } from '../entities/SolutionComponent';
import { ComponentType } from '../entities/ComponentType';
import { promises as fsPromises } from 'fs'; 
import { CanvasApp } from '../entities/CanvasApp';
import { getOutputChannel, outputHttpLog, outputHttpResult } from '../extension';
import { CliAcquisition } from '../lib/CliAcquisition';
import { env } from 'process';
export class Utils {
    static _cli: CliAcquisition;
	
    static async register(cli: CliAcquisition): Promise<void> {
		Utils._cli = cli;
        env.PACX = cli.cliExePath + "x";
        //env.PATH = `${env.PATH}${await cli.ensureInstalled()}${path.delimiter}`;
        //await this.executeChildProcess(`export pacx="${cli.cliExePath}"`);
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

    static async getSolutionPackerCommandLine(args?: string): Promise<string> {
        return await this.getToolsCommandLine(await Utils.getSolutionPackerPath(), args ?? "");    
    }

    static async getPowerPlatformCliPath(): Promise<string> {
        return `"${Settings.powerPlatformCli()}"`;
    }

    static async getSolutionPackerPath(): Promise<string> {
        const os = require('os');
        const fs = require('fs');
        let binPath = Settings.coreToolsSolutionPackager();
        if (fs.existsSync(binPath)) { return binPath; }
        switch (`${os.platform}`.toLowerCase()) {
            // Windows
            case "win32":  binPath = path.join(path.dirname(__filename), "..", "..", "bin/windows/CoreTools/SolutionPackager.exe"); break;
            
            // Mac-OS
            case "macos":
            case "darwin": binPath = path.join(path.dirname(__filename), "..", "..", "bin/macos/CoreTools/SolutionPacker.dll");   break;
            
            // Linux
            case "linux":
            case "freebsd":
            case "openbsd": 
            case "ubuntu":           
            default:       binPath = path.join(path.dirname(__filename), "..", "..", "bin/ubuntu/CoreTools/SolutionPacker");  break;            
        }
        
        if (fs.existsSync(binPath)) { return binPath; }
        return Settings.coreToolsSolutionPackager();
    }

    /**
     * Check the (Power Platform Cli) for Pack & Unpack PowerApps.
     * @returns success
     */
     static async checkPowerPlatformCli(): Promise<boolean> {
		const cmd = await Utils.getPowerPlatformCliCommandLine();
        var success = await Utils.executeChildProcess(cmd, () => {}, () => {}, path.dirname(Utils._cli?.cliExePath));
        if (success) {
            return true;
        } else {
            vscode.window.showErrorMessage(new vscode.MarkdownString(`The Power Apps Cli '${cmd}' was not found. Please download, compile and setup the tool from https://aka.ms/PowerAppsCLI`).value);
            return false;
        }
	}

    /**
     * Check the Core Tools Solution Packer for Pack & Unpack solutions.
     * @returns success
     */
     static async checkSolutionPackerTool(): Promise<boolean> {
        const fs = require('fs');
		const solutionPackerUtility = await Utils.getSolutionPackerPath();
        var success = fs.existsSync(solutionPackerUtility);
        if (success) {
            return true;
        } else {
            vscode.window.showErrorMessage(new vscode.MarkdownString(`The configured CrmSdk CoreTools Solution-Packer tool '${solutionPackerUtility}' was not found. Please download the tool from https://www.nuget.org/packages/Microsoft.CrmSdk.CoreTools`).value);
            return false;
        }
	}

    /**
     * Clear the credential cache for this extension.
     */
    static async clearCredentialCache() {
        const keytar  = require('keytar');
        const service = 'mme2k-powerapps-helper';
        const credentials = (await keytar.findCredentials(service));
        
        await credentials.forEach(async function(credential:any) {
            await keytar.deletePassword(service, credential.account);
        });
    }

    static onSuccess(result: any) {
        vscode.window.showInformationMessage(`${result}`);
    }

    static onError(err: any) {
        vscode.window.showErrorMessage(`${err}`);
    }
}