import { singleton } from 'aurelia-dependency-injection';
import { window, Progress, CancellationToken, ProgressLocation, TextDocument, workspace, WorkspaceEdit, ViewColumn, Position } from 'vscode';

@singleton(true)
export class UIService {
    public async info(message: string) {
        return await window.showInformationMessage(message);
    }

    public async warn(message: string) {
        return await window.showWarningMessage(message);
    }

    public async error(message: string) {
        return await window.showErrorMessage(message);
    }

    public async progress(message: string, task: (progress: Progress<{ message?: string; increment?: number }>, token: CancellationToken) => Promise<boolean>): Promise<boolean> {
        return await window.withProgress({
            location: ProgressLocation.Window,
            title: message,
            cancellable: true
        }, task);
    }

    public async filePicker(filters?: { [name: string]: string[] }, label?: string): Promise<string> {
        let uri = await window.showSaveDialog({ filters: filters, saveLabel: label });
        return <string>uri?.fsPath;
    }

    public async outputAsDocument(content: string) {
        const document = await workspace.openTextDocument();
        const edit = new WorkspaceEdit();
        
        edit.insert(document.uri, new Position(0, 0), content);
        workspace.applyEdit(edit);

        window.showTextDocument(document, { viewColumn: ViewColumn.Beside });
    }
}