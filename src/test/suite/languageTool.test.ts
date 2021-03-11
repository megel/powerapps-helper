import * as assert from 'assert';
import Sinon = require('sinon');
import * as vscode from 'vscode';

suite('Source File Utility Test', () => {

    test('checkSourceFileUtility', async () => {
        let infoMessages = Sinon.stub(vscode.window, "showInformationMessage");
        let errorMessages = Sinon.stub(vscode.window, "showErrorMessage");
        // await vscode.commands.executeCommand('mme2k-powerapps-helper.checkSourceFileUtility');

        // assert.strictEqual(errorMessages.callCount, 0);
        // assert.strictEqual(infoMessages.callCount, 1);
        // assert(infoMessages.firstCall.calledWith(Sinon.match("was found")));        
    }).timeout(10000);

});