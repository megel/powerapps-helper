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
import { PowerAppVersion } from '../entities/PowerAppVersion';
import { Solution } from '../entities/Solution';
import { utils } from 'mocha';
import { SolutionComponent } from '../entities/SolutionComponent';
import { ComponentType } from '../entities/ComponentType';
import { promises as fsPromises } from 'fs'; 
import { CanvasApp } from '../entities/CanvasApp';
export class Utils {
	
    static async postWithReturnArray<T>(url: string, convert: (ti: any) => T, sort: ((t1: T, t2: T) => number) | undefined, filter: ((t1: T) => boolean) | undefined, content: any | undefined, contentType: string | undefined, bearerToken? : string | undefined): Promise<T[]> {
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

    static async getWithReturnArray<T>(url: string, convert: (ti: any) => T, sort: ((t1: T, t2: T) => number) | undefined, filter: ((t1: T) => boolean) | undefined, bearerToken? : string | undefined): Promise<T[]> {
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
            if (! fs.existsSync(`${targetPath}`)) {
                fs.mkdirSync(`${targetPath}`, { recursive: true });
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

    static async executeChildProcess(cmd: string, onSuccess?: Action<any> | undefined, onError?: Action<any> | undefined): Promise<boolean> {
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
                if (onSuccess) {
                    onSuccess(result);
                } else {
                    vscode.window.showInformationMessage(`${result}`);
                }
            }            
            return true;
        } catch (err: any) {
            if (onError) {
                onError(err);
            } else {
                vscode.window.showErrorMessage(`${err}`);
            }
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
    
    /**
     * Check the Source file Utility for Pack & Unpack.
     * @returns success
     */
    static async checkSourceFileUtility() {
		const sourceFileUtility = Settings.sourceFileUtility();
        var success = await Utils.executeChildProcess(sourceFileUtility, () => {}, () => {});
        if (success) {
            return true;
        } else {
            vscode.window.showErrorMessage(new vscode.MarkdownString(`The configured Power Apps Source File Pack and Unpack Utility '${Settings.sourceFileUtility()}' was not found. Please download, compile and setup the tool from https://github.com/microsoft/PowerApps-Language-Tooling`).value);
            return false;
        }
	}
}