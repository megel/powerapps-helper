import { Disposable, WebviewPanel, Webview, WebviewOptions, ViewColumn, window, Uri } from 'vscode';
import { Application } from '../Application';
import { join } from 'path';
import { Solution } from '../entities/Solution';
import { PowerAppsDataProvider } from '../tree/PowerAppsDataProvider';
import { Environment } from '../entities/Environment';
import { APIUtils } from '../helpers/APIUtils';
import { IDependency, ISolution, RenderEngine, RenderGraphService } from '../services/RenderGraphService';
import * as vscode from 'vscode';

/**
 * Manages dependency view webview panels
 */
export class DependencyViewerPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static instance: DependencyViewerPanel | undefined;

    public static readonly viewType = "mme2k-powerapps-helper.DependencyView";

    private readonly _panel: WebviewPanel;
    private readonly _extensionUri: Uri;
    private _disposables: Disposable[] = [];

    protected extensionPath: string = "";

    private _selectedSolution!: ISolution | undefined;
    public get selectedSolution(): ISolution | undefined {
        return this._selectedSolution;
    }
    public set selectedSolution(value: ISolution | undefined) {
        this._selectedSolution = value;
    }
    private _solutions!: ISolution[];
    public get solutions(): ISolution[] {
        return this._solutions;
    }
    public set solutions(value: ISolution[]) {
        this._solutions = value;
    }
    private _dependencies!: IDependency[];
    public get dependencies(): IDependency[] {
        return this._dependencies;
    }
    public set dependencies(value: IDependency[]) {
        this._dependencies = value;
    }
    private _environment!: Environment | undefined;
    public get environment(): Environment | undefined {
        return this._environment;
    }
    public set environment(value: Environment | undefined) {
        this._environment = value;
    }
    private _content!: string;
    get content() {
        return this._content || "";
    }
    set content(_content: string) {
        this._content = _content || "";
        this._getHtmlForWebview(this._panel.webview, this._content).then((c) => (this._panel.webview.html = c));
    }
    private _pickedSolutions: string[] = [];
    public get pickedSolutions(): string[] {
        return this._pickedSolutions;
    }
    public set pickedSolutions(value: string[]) {
        this._pickedSolutions = value;
    }

    public static getWebviewOptions(extensionUri: Uri): WebviewOptions {
        return {
            // Enable javascript in the webview
            enableScripts: true,

            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [Uri.joinPath(extensionUri, "media"), Uri.joinPath(extensionUri, "media", "dependencyViewer"), Uri.joinPath(extensionUri, "media", "dependencyViewer", "scripts")],
        };
    }

    public static async createOrShow(extensionUri: Uri) {
        const column = window.activeTextEditor ? window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        if (DependencyViewerPanel.instance) {
            DependencyViewerPanel.instance._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = window.createWebviewPanel(DependencyViewerPanel.viewType, "Dependencies", column || ViewColumn.One, DependencyViewerPanel.getWebviewOptions(extensionUri));

        DependencyViewerPanel.instance = new DependencyViewerPanel(panel, extensionUri);
        DependencyViewerPanel.instance._panel.webview.html = await DependencyViewerPanel.instance._getHtmlForWebview(DependencyViewerPanel.instance._panel.webview, "");
    }

    public static async revive(panel: WebviewPanel, extensionUri: Uri) {
        DependencyViewerPanel.instance = new DependencyViewerPanel(panel, extensionUri);
        DependencyViewerPanel.instance._panel.webview.html = DependencyViewerPanel.instance._panel.webview.html || (await DependencyViewerPanel.instance._getHtmlForWebview(DependencyViewerPanel.instance._panel.webview, ""));
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
            (e) => {
                // Update, when previously hidden
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case "solutionSelected":
						const solutionId = message.value?.solutionId || "";
                        const switchViewMode = this._viewMode === (message.value?.viewMode || this._viewMode);
                        this._viewMode   = message.value?.viewMode || this._viewMode;
						switch(this._viewMode) {
							case ViewMode.overview:
								if (this.pickedSolutions.includes(solutionId)) {
									this.pickedSolutions = this.pickedSolutions.filter((s) => s !== solutionId);
								} else {
                                    this.pickedSolutions.push(solutionId);
                                }
                                delete this._graph["---"];
                                delete this._svg["---"];
								this.updateOverview(this._generateSolutionsOverview(this.solutions));
								break;
							case ViewMode.graph:
								this.selectedSolution = this.solutions.find((s) => s.solutionId === solutionId);
								this._selectedSolutionChanged();
								break;
							
						}
                        if (switchViewMode) {
                            this.switchView(this._viewMode);
                        }
                        return;
					
                    case "selection":
                        this.updateSelection(message.value?.select);
                        return;
					case "viewMode":
						this.switchView(message.value as ViewMode);
						return;
                    case "alert":
                        window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Update the current selection.
     * @param select (All, None, nonMSFT)
     */
    updateSelection(select: any): void {
        if (this._viewMode !== ViewMode.overview) { return; }
        switch (select?.toLowerCase()) {
            case "All".toLowerCase():     this.pickedSolutions = this.solutions.map(s => s.solutionId);  break;
            case "None".toLowerCase():    this.pickedSolutions = []; break;
            case "nonMSFT".toLowerCase(): this.pickedSolutions = this._getNonMicrosoftSolutions(this.solutions).map(s => s.solutionId); break;
            default: return;
        }
        this.updateOverview(this._generateSolutionsOverview(this.solutions));
    }

    private _update() {
        const webview = this._panel.webview;

        webview.postMessage({
            command: "updateContent",
            data: {
                caption: this._caption,
                summary: this._summary,
                graph: this._currentSvg,
                overview: this._overview,
            },
        });
        switch(this._viewMode) {
            case ViewMode.overview:
                this.updateOverview(this._overview);
                break;
            case ViewMode.graph:
                this.updateGraph();
                break;
        }
        this.switchView(this._viewMode);
        this.showProgress("");
    }

    public async selectSolutions(environment: Environment | undefined) {
        const provider = Application.container.get(PowerAppsDataProvider);

        if (environment === undefined) {
            environment = await provider.selectEnvironment();
        }
        if (environment === undefined) {
            return;
        }

        if (environment?.solutions === undefined || environment.solutions.length <= 0) {
            const convert = (data: any): Solution => Solution.convert(environment as Environment, data);
            environment.solutions = await APIUtils.getSolutions(environment.instanceApiUrl, convert, Solution.sort, undefined, undefined);
        }

        var solutions = environment.solutions
            ?.map((item) => {
                return {
                    solutionId: 	item.solutionData.solutionid,
                    name: 			item.solutionData.friendlyname,
                    version: 		item.solutionData.version,
					isManaged:      item.solutionData.ismanaged,
                    publisherName: 	item.publisher?.friendlyname,
                    publisherId: 	item.publisher?.uniquename,
                };
            })
            .sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            });

        if (solutions === undefined || solutions.length <= 0) {
            return;
        }

        this.showProgress("Collecting solution dependencies...");

        // wait for all solutions to get APIUtils.getSolutionDependencies
        // (this is a slow operation)
        var done = 0;
        var max = solutions.length;
        var allDependencies = Array();
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Collecting solution dependencies...`,
                cancellable: false,
            },
            async (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined }>, token: vscode.CancellationToken): Promise<any | undefined> => {
                var dependenciesResults = await Promise.all(
                    solutions.map(async (solution) => {
                        const r = await APIUtils.getSolutionDependencies(environment as Environment, solution);
                        done += 1;
                        progress.report({ increment: (done / max) * 100 });
                        return r;
                    })
                );
                dependenciesResults.forEach((item) => {
                    allDependencies = allDependencies.concat(item || []);
                });
            }
        );

        this._svg               = {};
        this._graph             = {};
        this._overview          = "";
        this._summary           = "";
        this._viewMode          = ViewMode.overview;
        this.solutions          = solutions;
        this.environment        = environment;
        this.dependencies       = allDependencies;
        this.pickedSolutions    = this._getNonMicrosoftSolutions(this.solutions).map((s) => s.solutionId);

        // Generate Overview
        const renderService = await Application.container.get(RenderGraphService);
        
        switch(this._viewMode as ViewMode)
        {
            case ViewMode.overview:
                this.updateOverview(this._generateSolutionsOverview(solutions));
                break;

            case ViewMode.graph:
                this.showProgress("Rendering solution overview...");
                const key = "---";
                this._graph[key] = await renderService.getGraphD365ceForSolutions(this.solutions, this.dependencies);
                this._svg[key] = (await renderService.renderGraph(this._graph[key], this.selectedSolution === undefined ? RenderEngine.circo : RenderEngine.dot)) || "";
                this._caption = `Environment ${this.environment?.properties.displayName} [${this.environment?.environmentSku}${Environment.getExpirationTime(this.environment?.properties)} | ${this.environment?.location}]`;
                this._summary = [this.environment?.description, `Solutions: ${this.solutions.length}`].filter((s) => s !== undefined).join("<br/>") || "";
                this.updateGraph();
            break;
        }
        this.showProgress();
    }

    private _getNonMicrosoftSolutions(solutions: ISolution[]): ISolution[]
    {
        // group publisher from solutions as distinct
        var rule = /^(microsoft|contoso)(?:.*)?$/i;
        var isMicrosoft = solutions.filter((s) => ! (
                (rule.test(s.publisherId?.toLowerCase()   || ""))
             || (rule.test(s.publisherName?.toLowerCase() || ""))
             || ["default"].includes(s.publisherName?.toLowerCase() || "") )
        );
        return solutions.filter(s => isMicrosoft.includes(s));
    }

    /**
     * Generate a HTML table of all solutions in the environment
     * @returns a HTML table of all solutions in the environment
     */
    private _generateSolutionsOverview(solutions: ISolution[]): string {
        //const filterSvg = this._panel.webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "powerapps-gray.png"));
        return [
			`<h2>Environment "${this.environment?.properties.displayName}" Overview</h2>`,
			`<table>
				<thead>
				  <tr>
				    <th></th>
					<th>Solution Name</th>
					<th>Publisher</th>
					<th>Managed</th>
					<th>Version</th>
				  </tr>
				</thead>
				<tbody>
				${solutions
				.map((s) => {
					return `<tr>
						<td><input class="overview solution" value="${s.solutionId}" type="checkbox" ${this._pickedSolutions.includes(s.solutionId) ? "checked" : ""}></td>
						<td>${s.name}</td>
						<td>${s.publisherName}</td>
						<td>${s.isManaged ? "Managed" : "Unmanaged"}</td>
						<td>${s.version}</td>
					</tr>`;
				})
				.join("")}
                    <tr>
                        <td colspan="5">
                            <table>
                              <tr>
                                <td><div class="overview-filter-button" value="All">    Select All</div></td>
                                <td>&nbsp;</td>
                                <td><div class="overview-filter-button" value="None">   Select None Solutions</div></td>
                                <td>&nbsp;</td>
                                <td><div class="overview-filter-button" value="nonMSFT">Exclude Microsoft Solutions</div></td>
                              </tr>
                            </table>
                        </td>
                    </tr>
				</tbody>
				</table>`
			].join("");

            // style="background-image: url('${filterSvg}');"
    }

    private async _selectedSolutionChanged() {
        const renderService = await Application.container.get(RenderGraphService);
        const key = (this.selectedSolution as any)?.solutionId || "---";
        const solutions = this.selectedSolution !== undefined ? [this.selectedSolution] : this.solutions.filter(s => this.pickedSolutions.length === 0 || this.pickedSolutions.includes(s.solutionId));

        if (this._graph[key] === undefined) {
            this.showProgress("Generate graph for solution dependencies...");
            if (this.selectedSolution === undefined) {
                this._graph[key] = (await renderService.getGraphD365ceForSolutions(solutions, this.dependencies)) || "";
            } else {
                const selectedSolutionId = this.selectedSolution.solutionId;
                const relatedSolutionIds = [selectedSolutionId];
                const relatedSolutionDeps = this.dependencies.filter(d => [d.dependentComponentBaseSolutionId, d.requiredComponentBaseSolutionId].includes(selectedSolutionId));
                for (const d of relatedSolutionDeps) {
                    relatedSolutionIds.push(d.dependentComponentBaseSolutionId);
                    relatedSolutionIds.push(d.requiredComponentBaseSolutionId);
                }
                
                this._graph[key] = (await renderService.getGraphD365ceForDependencies(this.solutions.filter(s => relatedSolutionIds.includes(s.solutionId)), this.dependencies, this.selectedSolution)) || "";
            }
        }
        if (this._svg[key] === undefined) {
            this.showProgress("Rendering solution dependency graph...");
            this._svg[key] = (await renderService.renderGraph(this._graph[key], this.selectedSolution === undefined ? RenderEngine.circo : RenderEngine.dot)) || "";
        }

        this.updateGraph();
        this.showProgress();
    }

    private _graph: { [key: string]: string } = {};
    private _svg: { [key: string]: string } = {};
    private _summary: string = "";
    private _caption: string = "";
    private _currentSvg: string = "";
    private _overview: string = "";
    private _viewMode: ViewMode = ViewMode.overview;

    /**
     *  Show a progress message in WebView
     */
    public showProgress(message = "") {
        this._panel.webview.postMessage({ command: "progress", data: message });
    }

    /**
     * Update the environment overview with the given content
     * @param content
     */
    public updateOverview(content: string) {
        this._panel.webview.postMessage({
            command: "updateOverview",
            data:   { 
                        overview: (this._overview = content),
                    }
        });
    }

    /**
     * Switch the view mode to the given view.
     * @param view
     */
    public switchView(view : ViewMode = ViewMode.overview) {
        if (view === ViewMode.graph && this.pickedSolutions?.length === 0) {
            this._panel.webview.postMessage({ command: "alert", data: "Please select at least one solution!" });    
            view = ViewMode.overview;
        }
        this._viewMode = view;
        this._panel.webview.postMessage({ command: "switchView", data: {viewMode: this._viewMode } });
    }

    /**
     * Update the graph in the WebView.
     */
    private updateGraph() {
        const key = (this.selectedSolution as any)?.solutionId || "---";
        this._currentSvg = this._svg[key] || "";

        this._panel.webview.postMessage({
            command: "updateContent",
            data: {
                graph: this._currentSvg,
                summary: this._summary,
                caption: this._caption,
                overview: this._overview,
            },
        });
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

    /**
     * Generate the VebView HTML content and initialize all JavaScripts
     * @param webview
     * @param viewContent
     * @returns the generated html content for the webview
     */
    private async _getHtmlForWebview(webview: Webview, viewContent: string) {
        // Local path to main script run in the webview
        const scriptUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "dependencyViewer", "scripts", "main.js"));

        // Local path to css styles
        const styleResetUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "dependencyViewer", "reset.css"));
        const styleVSCodeUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "dependencyViewer", "vscode.css"));
        const styleMainUri = webview.asWebviewUri(Uri.joinPath(this._extensionUri, "media", "dependencyViewer", "main.css"));

        // Use a nonce to only allow specific scripts to be run
        const nonce = this.getNonce();

        let f = Uri.joinPath(this._extensionUri, "media", "dependencyViewer", "index.html");
        let content: string = await Application.readFile(Uri.joinPath(this._extensionUri, "media", "dependencyViewer", "index.html").fsPath);
        // Replace all ${...} in html with Regex
        content = content.replace(/\$\{scriptUri\}/g, `${scriptUri}`);
        content = content.replace(/\$\{cspSource\}/g, `${webview.cspSource}`);

        content = content.replace(/\$\{styleResetUri\}/g, `${styleResetUri}`);
        content = content.replace(/\$\{styleVSCodeUri\}/g, `${styleVSCodeUri}`);
        content = content.replace(/\$\{styleMainUri\}/g, `${styleMainUri}`);
        content = content.replace(/\$\{nonce\}/g, `${nonce}`);

        // Add the dynamic content
        content = content.replace(/\$\{content\}/g, `${viewContent}`);

        return content;
    }

    private getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

enum ViewMode {
    overview = "overview",
	graph = "graph",
}
	
