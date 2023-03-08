import { Disposable, WebviewPanel, Webview, WebviewOptions, ViewColumn, window, Uri } from 'vscode';
import { Application } from '../Application';
import { join } from 'path';

/**
 * Manages dependency view webview panels
 */
export class DependencyViewerPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static instance: DependencyViewerPanel | undefined;

	public static readonly viewType = 'mme2k-powerapps-helper.DependencyView';

	private readonly _panel: WebviewPanel;
	private readonly _extensionUri: Uri;
	private _disposables: Disposable[] = [];

    protected extensionPath: string = '';

    public static getWebviewOptions(extensionUri: Uri): WebviewOptions {
        return {
            // Enable javascript in the webview
            enableScripts: true,
            
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [
				Uri.joinPath(extensionUri, 'media'),
				Uri.joinPath(extensionUri, 'media', 'dependencyViewer'),
				Uri.joinPath(extensionUri,  'media', 'dependencyViewer', 'scripts')
			]
        };
    }

	public static createOrShow(extensionUri: Uri) {
		const column = window.activeTextEditor  ? window.activeTextEditor.viewColumn : undefined;

		// If we already have a panel, show it.
		if (DependencyViewerPanel.instance) {
			DependencyViewerPanel.instance._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = window.createWebviewPanel(
			DependencyViewerPanel.viewType,
			'Dependencies',
			column || ViewColumn.One,
			DependencyViewerPanel.getWebviewOptions(extensionUri),
		);

		DependencyViewerPanel.instance = new DependencyViewerPanel(panel, extensionUri);
	}

	public static revive(panel: WebviewPanel, extensionUri: Uri) {
		DependencyViewerPanel.instance = new DependencyViewerPanel(panel, extensionUri);
	}

	private constructor(panel: WebviewPanel, extensionUri: Uri) {
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
						window.showErrorMessage(message.text);
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
		DependencyViewerPanel.instance = undefined;

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
		// 	case ViewColumn.Two:
		// 		this._updateForCat(webview, 'Compiling Cat');
		// 		return;

		// 	case ViewColumn.Three:
		// 		this._updateForCat(webview, 'Testing Cat');
		// 		return;

		// 	case ViewColumn.One:
		// 	default:
		// 		this._updateForCat(webview, 'Coding Cat');
		// 		return;
		// }
	}

	
	
	public updateDependencies(title: string, overview: string, dependencies: any[]) {

		const overviewSummary = dependencies.map(item => {
			const solution        = item.solution;

			return `
				<h2>${solution.friendlyname}</h2>
				<div class="svg-container">${item.svg}</div>
			`;
		});

		const content = `
			
			${dependencies.length === 0 ? "<h1>Solutions</h1>" : ""}
					
			<div class="svg-container">${overview}</div>

			${overviewSummary.join("\n")}

		`;

		this?._updateDependencies(this._panel.webview, title, content);
	}

	private async _updateDependencies(webview: Webview, title: string, viewContent: string) {
		this._panel.title = title;
		this._panel.webview.html = await this._getHtmlForWebview(webview, viewContent);
	}

	private async _getHtmlForWebview(webview: Webview, viewContent: string) {
		// Local path to main script run in the webview
		const scriptUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'dependencyViewer', 'scripts', 'main.js'));

		// Local path to css styles
		const styleResetUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'dependencyViewer', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'dependencyViewer', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, 'media', 'dependencyViewer', 'main.css'));

		// Use a nonce to only allow specific scripts to be run
		const nonce = this.getNonce();

		let f = Uri.joinPath(this._extensionUri, 'media', 'dependencyViewer', 'index.html');
        let content: string = await Application.readFile(Uri.joinPath(this._extensionUri, 'media', 'dependencyViewer', 'index.html').fsPath);
		// Replace all ${...} in html with Regex		
		content = content.replace(/\$\{scriptUri\}/g,         `${scriptUri}`);
        content = content.replace(/\$\{cspSource\}/g,         `${webview.cspSource}`);
        
		content = content.replace(/\$\{styleResetUri\}/g,     `${styleResetUri}`);
		content = content.replace(/\$\{styleVSCodeUri\}/g,    `${styleVSCodeUri}`);
		content = content.replace(/\$\{styleMainUri\}/g,      `${styleMainUri}`);
		content = content.replace(/\$\{nonce\}/g,         	  `${nonce}`);
		
		// Add the dynamic content
		content = content.replace(/\$\{content\}/g,           `${viewContent}`);
		
        return content;
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