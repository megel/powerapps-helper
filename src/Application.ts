import { Container } from 'aurelia-dependency-injection';
import { LogService } from './services/LogService';
import { UIService } from './services/UIService';
import { DependencyViewerPanel } from './panels/DependencyViewerPanel';
import { ExtensionContext, workspace } from 'vscode';
import { readFile } from 'fs-extra';
const packageConfig: any = require('../package.json');


export class Application {
    private _panelActive: boolean = false;
    private _container: Container;
    private _context!: ExtensionContext;
    private _extensionName: string;
    private _displayName: string;
    private _debugMode: boolean;
    private _logService: LogService;
    private _uiService: UIService;
    private static _instance: Application;

    private constructor() {
        this._extensionName = `${packageConfig.author.name}.${packageConfig.name}`;
        this._displayName = packageConfig.displayName;
        this._debugMode = packageConfig.debugMode === true;
        this._container = (new Container()).makeGlobal();
        this._logService = this._container.get(LogService);
        this._uiService = this._container.get(UIService);
        this._uiService = this._container.get(UIService);
    }

    public static get container() {
        return Application._instance._container;
    }

    public static get debugMode() {
        return Application._instance._debugMode;
    }

    public static get displayName() {
        return Application._instance._displayName;
    }

    public static get extensionName() {
        return Application._instance._extensionName;
    }

    public static get config() {
        let config = workspace.getConfiguration('mme2k-powerapps-helper');
        return config;
    }

    public static get instance() {
        if (!Application._instance) {
            Application._instance = new Application();
        }

        return Application._instance;
    }

    static get context() {
        return Application.instance._context;
    }

    static set context(_context: ExtensionContext) {
        Application.instance._context = _context;
    }

    static get log() {
        return Application._instance._logService;
    }

    static get ui() {
        return Application._instance._uiService;
    }

    static get panelActive() {
        return Application._instance._panelActive;
    }

    static set panelActive(newVal: boolean) {
        Application._instance._panelActive = newVal;
    }

    static async activate() {
        await Application.instance._activate();
    }

    static async deactivate() {
        await Application.instance._deactivate();
    }


    private async _activate() {

        this._logService.info(`Extension "${Application.extensionName}" is now activated.`);
    }

    private async _deactivate() {
        DependencyViewerPanel.instance?.dispose();
        this._logService.debug(`Extension "${Application.extensionName}" has been deactivated.`);
    }




    static async readFile(file: any): Promise<string> {
        return new Promise((resolve, reject) => {
            readFile(file, "utf8", (err: any, data: any) => {
                if (err) {reject(err);}
                else {resolve(data);}
            });
        });
    }
}