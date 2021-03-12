import * as assert from 'assert';
import Sinon = require('sinon');
import * as vscode from 'vscode';
import * as myExtension from '../../extension';
import {Utils} from '../../helpers/Utils';

suite('Source File Utility Test', () => {

    test('checkSourceFileUtilityFolder', async () => {
        const fs = require('fs');
        const binPath = await Utils.getSourceFileUtility();
        assert.strictEqual(fs.existsSync(binPath), true, "File was found");
    }).timeout(10000);

    test('checkSourceFileUtility', async () => {
        let infoMessages = Sinon.stub(vscode.window, "showInformationMessage");
        let errorMessages = Sinon.stub(vscode.window, "showErrorMessage");
        await vscode.commands.executeCommand('mme2k-powerapps-helper.checkSourceFileUtility');

        //const os = require('os');
        // if (`${os.platform}`.toLowerCase() !== "win32") {
        //     // Test skipped
        //     return;
        // }
        assert.strictEqual(errorMessages.callCount, 0, `Error was shown ... ${errorMessages.callCount}`);
        assert.strictEqual(infoMessages.callCount, 1, `No Info was shown ... ${infoMessages.callCount}`);
        assert(infoMessages.firstCall.calledWith(Sinon.match("was found")), "Language Tool was not found");
    }).timeout(10000);

});