import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Initialization Test Suite', () => {

	test("extension should be present", () => {
		assert.ok(vscode.extensions.getExtension("megel.mme2k-powerapps-helper"));
	});

	test("dependency extension ms-vscode.azure-account should be present", () => {
		assert.ok(vscode.extensions.getExtension("ms-vscode.azure-account"));
	}).timeout(20000);

	test("dependency extension microsoft-IsvExpTools.powerplatform-vscode should be present", () => {
		assert.ok(vscode.extensions.getExtension("microsoft-IsvExpTools.powerplatform-vscode"));
	}).timeout(60000);

	test('extension is activatable', async () => {
		const extension = vscode.extensions.getExtension("megel.mme2k-powerapps-helper");

		if (!extension?.isActive) {
			await extension?.activate();
		}

		assert(extension?.isActive);
	}).timeout(60000);


	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
	
});
