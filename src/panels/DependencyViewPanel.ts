import * as vscode from 'vscode';

/**
 * Manages dependency view webview panels
 */
export class DependencyViewProvider {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static instance: DependencyViewProvider | undefined;

	public static readonly viewType = 'mme2k-powerapps-helper.DependencyView';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

    public static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
        return {
            // Enable javascript in the webview
            enableScripts: true,
    
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        };
    }

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (DependencyViewProvider.instance) {
			DependencyViewProvider.instance._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			DependencyViewProvider.viewType,
			'Dependencies',
			column || vscode.ViewColumn.One,
			DependencyViewProvider.getWebviewOptions(extensionUri),
		);

		DependencyViewProvider.instance = new DependencyViewProvider(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		DependencyViewProvider.instance = new DependencyViewProvider(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				
				switch (message.command) {
					case 'solutionSelected':
						this._panel.webview.postMessage({ command: 'progress', data: "SUCCESS!!!" });
						return;

					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		DependencyViewProvider.instance = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;

		// // Vary the webview's content based on where it is located in the editor.
		// switch (this._panel.viewColumn) {
		// 	case vscode.ViewColumn.Two:
		// 		this._updateForCat(webview, 'Compiling Cat');
		// 		return;

		// 	case vscode.ViewColumn.Three:
		// 		this._updateForCat(webview, 'Testing Cat');
		// 		return;

		// 	case vscode.ViewColumn.One:
		// 	default:
		// 		this._updateForCat(webview, 'Coding Cat');
		// 		return;
		// }
	}

	
	
	public updateDependencies(title: string, overview: string, dependencies: any[]) {
		this?._updateDependencies(this._panel.webview, title, overview, dependencies);
	}

	private _updateDependencies(webview: vscode.Webview, title: string, overview: string, dependencies: any[]) {
		this._panel.title = title;
		this._panel.webview.html = this._getHtmlForWebview(webview, overview, dependencies);
	}

	private _getHtmlForWebview(webview: vscode.Webview, overview: string, dependencies: any[]) {
		// Local path to main script run in the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Local path to css styles
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow specific scripts to be run
		const nonce = this.getNonce();
		
		const overviewSummary = dependencies.map(item => {
			const solution        = item.solution;

			return `
				<h2>${solution.friendlyname}</h2>
				<div class="svg-container">${item.svg}</div>
			`;
		});

		// <script nonce="${nonce}" src="/scripts/snippet-javascript-console.min.js?v=1"></script>
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				
				<meta http-equiv="Content-Security-Policy" 
					content="default-src 'none'; 
					style-src ${webview.cspSource}; 
					script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Solution Dependencies</title>
			</head>
			<body>
				<div id="info"></div>

				<button id="btnSolution" type="button">Solution</button>

				<div id="zoom" style="visibility:hidden;">
					<table>
					<tr><td>Zoom: </td><td><input id="zoomSlider" class="zoom-slider" min="1" max="10" value='10' step="1" type="range"/></td></tr>
					</table>
				</div>

				<div class="container">
					${dependencies.length === 0 ? "<h1>Solutions</h1>" : ""}
					
					<div class="svg-container">${overview}</div>

					${overviewSummary.join("\n")}
				</div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}