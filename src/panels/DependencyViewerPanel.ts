import { Disposable, WebviewPanel, Webview, WebviewOptions, ViewColumn, window, Uri } from 'vscode';
import { Application } from '../Application';
import { join } from 'path';
import { Solution } from '../entities/Solution';
import { PowerAppsDataProvider } from '../tree/PowerAppsDataProvider';
import { Environment } from '../entities/Environment';
import { APIUtils } from '../helpers/APIUtils';
import { IDependency, ISolution, IMSDynSolutionComponent, ISolutionComponent, RenderEngine, RenderGraphService, IGraphData as IDependencyGraphData } from '../services/RenderGraphService';
import * as vscode from 'vscode';
import { SolutionComponent } from '../entities/SolutionComponent';
import { isCompass } from 'ts-graphviz';

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
    private _allSolutionComponents!: ISolutionComponent[];
    public get allSolutionComponents(): ISolutionComponent[] {
        return this._allSolutionComponents;
    }
    public set allSolutionComponents(value: ISolutionComponent[]) {
        this._allSolutionComponents = value;
    }
    private _allMSDynSolutionComponents!: IMSDynSolutionComponent[];
    public get allMSDynSolutionComponents(): IMSDynSolutionComponent[] {
        return this._allMSDynSolutionComponents;
    }
    public set allMSDynSolutionComponents(value: IMSDynSolutionComponent[]) {
        this._allMSDynSolutionComponents = value;
    }
    private _allTypeNames!: { [key: number]: string; };
    public get allTypeNames(): { [key: number]: string; } {
        return this._allTypeNames;
    }
    public set allTypeNames(value: { [key: number]: string; }) {
        this._allTypeNames = value;
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
					case "openGraphInEditor":
                        const key = (this.selectedSolution as any)?.solutionId || "---";
                        if (this._graph[key] !== undefined) {
                            this.generateOrUpdateGraph(key)
                                .then(graph => Application.ui.outputAsDocument(graph));                            
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

    /**
     * Select a new environment and collect dependency information
     * @param environment or undefined
     * @returns 
     */
    public async selectEnvironment(environment: Environment | undefined) {
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
                    solutionId: 	 item.solutionData.solutionid,
                    name: 			 item.solutionData.friendlyname,
                    version: 		 item.solutionData.version,
					isManaged:       item.solutionData.ismanaged,
                    publisherName: 	 item.publisher?.friendlyname,
                    publisherId: 	 item.publisher?.uniquename,
                    components:      [],
                    msDynComponents: [],
                } as ISolution;
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
        var max = solutions.length * 2;
        var allDependencies = Array();
        
        var allSolutionComponents = APIUtils.getSolutionComponents(environment?.instanceApiUrl ?? "", DependencyViewerPanel.convertComponent, undefined, undefined, undefined, undefined, undefined, 
            "objectid,componenttype,solutioncomponentid,rootsolutioncomponentid,_solutionid_value,ismetadata");
        var allMSDynSolutionComponents = APIUtils.getMSDynSolutionComponents(environment?.instanceApiUrl ?? "", DependencyViewerPanel.convertMSDynComponent);
                
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
                progress.report({ message: "Summarize dependencies", increment: (done / max) * 100 });
                dependenciesResults.forEach((item) => {
                    allDependencies = allDependencies.concat(item || []);
                });

                progress.report({ message: "Collect component information", increment: (done / max) * 100 });
                this._allSolutionComponents = await allSolutionComponents;
                this._allMSDynSolutionComponents = await allMSDynSolutionComponents;
                this._allTypeNames = this._allMSDynSolutionComponents.concat(this._allSolutionComponents)
                    .filter(c => c?.typeName !== undefined && c?.typeName.length > 0)
                    .reduce((acc, item) => {
                        acc[item.type] = item.typeName;
                        return acc;
                    }, {} as {[key: number]: string});

                solutions.forEach(async s => this._allSolutionComponents.filter(c => c.solutionId === s.solutionId).forEach(c => s.components.push(c)));
                solutions.forEach(async s => this._allMSDynSolutionComponents.filter(c => c.solutionId === s.solutionId).forEach(c => s.msDynComponents.push(c)));

                progress.report({ increment: 100 });
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
        this.switchView(this._viewMode);

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
        
        await this.generateOrUpdateGraph(key);

        if (this._svg[key] === undefined) {
            this.showProgress("Rendering solution dependency graph...");
            this._svg[key] = (await renderService.renderGraph(this._graph[key], this.selectedSolution === undefined ? RenderEngine.circo : RenderEngine.dot)) || "";
        }

        this.updateGraph();
        this.showProgress();
    }

    private static convertComponent = (data: any): ISolutionComponent => { return ({ 
        // objectid,componenttype,solutioncomponentid,rootsolutioncomponentid,_solutionid_value,ismetadata
        solutionId: data._solutionid_value,
        id:         data.objectid,
        name:       "",
        type:       data.componenttype,
        solutionComponentId: data.solutioncomponentid,
        rootSolutionComponentId: data.rootsolutioncomponentid,
        isMetadata: data.ismetadata,
    }) as ISolutionComponent; };

    private static convertMSDynComponent = (data: any): IMSDynSolutionComponent => { return ({ 
        solutionId: data.msdyn_solutionid,
        id:         data.msdyn_objectid,
        name:       data.msdyn_name,
        type:       data.msdyn_componenttype,
        typeName:   data.msdyn_componenttypename,
        isManaged:  data.ismanaged,
    }) as IMSDynSolutionComponent; };

    private async generateOrUpdateGraph(key: string = "") : Promise<string> {
        const renderService = await Application.container.get(RenderGraphService);
        if (key === undefined || key === "") { key = (this.selectedSolution as any)?.solutionId || "---"; }
        const solutions = this.selectedSolution !== undefined ? [this.selectedSolution] : this.solutions.filter(s => this.pickedSolutions.length === 0 || this.pickedSolutions.includes(s.solutionId));
        
        // TODO: remove
        delete this._graph[key];

        if (this._graph[key] === undefined) {
            this.showProgress("Generate graph for solution dependencies...");
            if (this.selectedSolution === undefined) {
                this._graph[key] = (await renderService.getGraphD365ceForSolutions(solutions, this.dependencies)) || "";
            } else {                
                const graphData = await this.calculateDependencies(this.selectedSolution);
                
                if (graphData.selected) {
                    this._graph[key] = (await renderService.getGraphD365ceForDependencies(graphData)) || "";
                }
                // TODO Cache the result
                // const selectedSolutionId = this.selectedSolution.solutionId;
                // const relatedSolutionIds = [selectedSolutionId];
                // const relatedSolutionDeps = this.dependencies.filter(d => [d.dependentComponentBaseSolutionId, d.requiredComponentBaseSolutionId].includes(selectedSolutionId));
                // for (const d of relatedSolutionDeps) {
                //     relatedSolutionIds.push(d.dependentComponentBaseSolutionId);
                //     relatedSolutionIds.push(d.requiredComponentBaseSolutionId);
                // }
                // const filteredSolutions = this.solutions.filter(s => relatedSolutionIds.includes(s.solutionId));                
                //this._graph[key] = (await renderService.getGraphD365ceForDependencies(filteredSolutions, this.dependencies, this.selectedSolution)) || "";                
            }
        }
        return this._graph[key];
    }
    
    /**
     * Calculate the dependency information for graph rendering
     * @param selectedSolution 
     * @returns dependency information for graph rendering
     */
    private async calculateDependencies(selectedSolution: ISolution): Promise<IDependencyGraphData>
    {
        const selectedSolutionId = selectedSolution.solutionId;
        const relatedSolutionIds = [selectedSolutionId];
        var allDependencies : IDependency [] = [];
        // *** Solution Dependencies ***
        const relatedSolutionDeps = this.dependencies.filter(d => [d.dependentComponentBaseSolutionId, d.requiredComponentBaseSolutionId].includes(selectedSolutionId));
        
        // Add related solutions
        for (const d of relatedSolutionDeps) {
            relatedSolutionIds.push(d.dependentComponentBaseSolutionId);
            relatedSolutionIds.push(d.requiredComponentBaseSolutionId);
        }

        // *** Get Component Dependencies ***
        // Find all solution, which contains this component (this is because components of unmanaged solutions are pointing to the active solution in the environment)
        const findSolutions = (id?: any) : ISolution[] | undefined => { 
            const c = this._allSolutionComponents?.find(item => item.id === id);
            const cMSDyn = this._allMSDynSolutionComponents?.find(item => item.id === id || c?.solutionComponentId);
            const s = this.solutions?.filter(item => item.solutionId === cMSDyn?.solutionId || c?.solutionId);
            return s;
        };

        const completeDependencies = (d: IDependency): IDependency[] => {
            const result = [d];
            // Add additional required solutions
            (findSolutions(d.requiredComponentObjectId) ?? [])
                .filter(s => s.solutionId !== d.requiredComponentBaseSolutionId)
                .forEach(s => {
                const clone: IDependency = { ...d };
                clone.requiredComponentBaseSolutionId   = s?.solutionId;
                clone.requiredComponentBaseSolutionName = s.name;
                result.push(clone);
            });

            // Add additional dependant solutions
            (findSolutions(d.dependentComponentObjectId) ?? [])
                .filter(s => s.solutionId !== d.dependentComponentBaseSolutionId)
                .forEach(s => {                
                const clone: IDependency = { ...d };
                clone.dependentComponentBaseSolutionId   = s?.solutionId;
                clone.dependentComponentBaseSolutionName = s.name;
                result.push(clone);
            });

            return result;
        };
        
        // Filter the solutions
        const filteredSolutions   = this.solutions.filter(s => relatedSolutionIds.includes(s.solutionId));
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Collecting solution dependencies...`,
                cancellable: false,
            },
            async (progress: vscode.Progress<{ message?: string | undefined; increment?: number | undefined }>, token: vscode.CancellationToken): Promise<any | undefined> => {
                
                var done = 0;
                var max = filteredSolutions.length;
                const filteredSolutionIDs = filteredSolutions.map(s => s.solutionId);
            
                // (this is a slow operation)
                var dependenciesResults = await Promise.all(
                    filteredSolutions.map(async (solution) => {
                        var solutionComponents = this.allSolutionComponents.filter(c => filteredSolutionIDs.includes(c.solutionId));
                        var dr : IDependency[] = [];
                        
                        var cr = await Promise.all(
                            solutionComponents.map(async (component) => (await APIUtils.getSolutionComponentDependencies(this.environment as Environment, completeDependencies, component))
                                                                        //.map(d => completeDependencies(d))
                                                                        )
                        );
                        // TODO: Cache the result
                        
                        done += 1;
                        progress.report({ increment: (done / max) * 100 });
                        cr.forEach(r => dr = dr.concat(r || []));
                        return dr;
                    })
                );

                // Concat all Dependencies
                dependenciesResults.forEach((item) => {
                    allDependencies = allDependencies.concat(item || []);
                });
            }
        );

        // Add additional solutions, which are now visible by calculated dependencies
        const allDependenciesSolutionIds : string[] = []; 
        allDependencies.forEach(d => allDependenciesSolutionIds.push(d.dependentComponentBaseSolutionId, d.requiredComponentBaseSolutionId));

        // TODO
        // this.solutions.forEach(s => {
        //     if (allDependenciesSolutionIds.includes(s.solutionId)) {
        //         filteredSolutions.push(s);
        //     }
        // });

        const dcIDs = allDependencies.filter(d => allDependenciesSolutionIds.includes(d.requiredComponentBaseSolutionId)).map(d => d.requiredComponentObjectId).concat(
            allDependencies.filter(d => allDependenciesSolutionIds.includes(d.dependentComponentBaseSolutionId)).map(d => d.dependentComponentObjectId));
        
        const getComponents         = (solutionId: any) : ISolutionComponent[] => this._allSolutionComponents.filter(c => c.solutionId === solutionId && dcIDs.includes(c.id));
        const getMSDynComponents    = (solutionId: any) : IMSDynSolutionComponent[] => this._allMSDynSolutionComponents.filter(c => c.solutionId === solutionId && dcIDs.includes(c.id));
        const newSolutions: ISolution[] = [];
        
        allDependenciesSolutionIds
            .filter(id => this.solutions.find(s => id === s.solutionId) === undefined)
            .forEach(id => {
                var d = allDependencies.find(dd => dd.requiredComponentBaseSolutionId);
                if (d && ! filteredSolutions.concat(newSolutions).find(s => s.solutionId === d?.requiredComponentBaseSolutionId)) {
                    const newSolution = {solutionId: d.requiredComponentBaseSolutionId, name: d.requiredComponentBaseSolutionName, components: getComponents(d.requiredComponentBaseSolutionId), msDynComponents: getMSDynComponents(d.requiredComponentBaseSolutionId)};
                    newSolutions.push(newSolution);
                    return;
                }
                d = allDependencies.find(dd => dd.dependentComponentBaseSolutionId);
                if (d && ! filteredSolutions.concat(newSolutions).find(s => s.solutionId === d?.dependentComponentBaseSolutionId)) {
                    const newSolution = {solutionId: d.dependentComponentBaseSolutionId, name: d.dependentComponentBaseSolutionName, components: getComponents(d.dependentComponentBaseSolutionId), msDynComponents: getMSDynComponents(d.dependentComponentBaseSolutionId)};
                    newSolutions.push(newSolution);
                    return;
                }
            });

        // (this is a slow operation)
        var   newDependencies: IDependency[] = [];
        var dependenciesResults = await Promise.all(
            newSolutions.map(async (solution) => {
                var dr : IDependency[] = [];
                var cr = await Promise.all(solution.msDynComponents.concat(solution.components).map(async (component) => (await APIUtils.getSolutionComponentDependencies(this.environment as Environment, completeDependencies, component))));
                cr.forEach(r => dr = dr.concat(r || []));
                return dr;
            })
        );
        dependenciesResults.forEach(dr => newDependencies = newDependencies.concat(dr));
        
        return {
            solutions: filteredSolutions.concat(newSolutions),
            dependencies: allDependencies.concat(newDependencies),
            selected: this.selectedSolution,
            components: this._allSolutionComponents,
            msDynComponents: this._allMSDynSolutionComponents,
            typeNames: this._allTypeNames,
        } as IDependencyGraphData;
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
                viewMode: this._viewMode,
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
	
