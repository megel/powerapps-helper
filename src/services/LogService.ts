import { Application } from "../Application";
import { singleton } from "aurelia-dependency-injection";

@singleton(true)
export class LogService {
    log(message: string, logLevel: LogLevel, optionalParams?: any) {
        let msg = this.template.replace('[level]', `[${LogLevel[logLevel]}]`).replace('[msg]', message);

        switch (logLevel) {
            default:
            case LogLevel.Info:
                if (optionalParams)
                    {console.info(msg, optionalParams);}
                else
                    {console.info(msg);}
                break;
            case LogLevel.Debug:
                let debug = Application.debugMode === true;
                if (debug !== true) {
                    return;
                }

                if (optionalParams)
                    {console.debug(msg, optionalParams);}
                else
                    {console.debug(msg);}
                break;
            case LogLevel.Warning:
                if (optionalParams)
                    {console.warn(msg, optionalParams);}
                else
                    {console.warn(msg);}
                break;
            case LogLevel.Error:
                if (optionalParams)
                    {console.error(msg, optionalParams);}
                else
                    {console.error(msg);}
                break;
        }
    }

    debug(message: string, optionalParams?: any) {
        this.log(message, LogLevel.Debug, optionalParams);
    }

    info(message: string, optionalParams?: any) {
        this.log(message, LogLevel.Info, optionalParams);
    }

    warn(message: string, optionalParams?: any) {
        this.log(message, LogLevel.Warning, optionalParams);
    }

    error(message: string, optionalParams?: any) {
        this.log(message, LogLevel.Error, optionalParams);
    }

    public get template() {
        return `[${Application.displayName}][${(new Date()).toISOString()}][level]: [msg]`;
    }
}

export enum LogLevel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Debug,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Info,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Warning,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Error
}