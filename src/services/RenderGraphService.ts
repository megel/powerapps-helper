import { optional, singleton } from "aurelia-dependency-injection";
import { Settings } from "../helpers/Settings";
import * as axios from "axios";
import { Application } from "../Application";
import * as vscode from 'vscode';
import { type } from "os";

export interface IGraphData {
    solutions: ISolution[];
    selected?: ISolution;
    dependencies: IDependency[];
    msDynComponents: IMSDynSolutionComponent[];
    components: ISolutionComponent[];
    typeNames: {[key: number]: string};
}

export interface ISolution {
    solutionId: string;
    name: string;
    version?: string;
    isManaged?: boolean;
    publisherId?: string;
    publisherName?: string;
    components: ISolutionComponent[];
    msDynComponents: IMSDynSolutionComponent[];
}

export interface IMSDynSolutionComponent {
    id: string;
    solutionId: string;
    name: string;
    typeName: string;
    type: number;
    isManaged: number;
}

export interface ISolutionComponent extends IMSDynSolutionComponent {
    solutionComponentId?: string;
    rootSolutionComponentId?: string;
    isMetadata?: boolean;
    components: ISolutionComponent[];
}

export interface IDependency {
    requiredComponentBaseSolutionId:   string;
    requiredComponentBaseSolutionName: string;
    requiredComponentName:             string;
    requiredComponentObjectId:         string;
    requiredComponentDisplayName:      string;
    requiredComponentTypeName:         string;
    requiredComponentType:             number;
    
    dependentComponentBaseSolutionId:   string;
    dependentComponentBaseSolutionName: string;
    dependentComponentObjectId:         string;
    dependentComponentName:             string;
    dependentComponentDisplayName:      string;
    dependentComponentTypeName:         string;
    dependentComponentType:             number;
}

export enum RenderEngine {
  dot   = "dot",
  circo = "circo"
}

interface IGraphvizNode {
    id:    string;
    stackId: string;
    value: any;    
    children: IGraphvizNode[];
    refId: any;
    solution?: ISolution;
    component?: ISolutionComponent;
}

interface IDataverseComponent {
    id:          string;
    displayName: string;
    typeName:    string;
    type:        number;
    // The 
    component?:      ISolutionComponent | undefined;
    msDynComponent?: IMSDynSolutionComponent | undefined;
}

@singleton(true)
export class RenderGraphService {
    // TODO: Settings
    
    private get showIdsInLabel(): boolean {
        return Settings.showIdsInLabel();
    }
    private useClusteredComponents(): boolean {
        return Settings.useClusteredComponents();
    }
    private fontSizeSolution(): string {
        return Settings.fontSizeSolution() ?? "12pt";
    }
    private fontSizeComponent(): string {
        return Settings.fontSizeComponent() ?? "11pt";
    }
    private fontSizeComponentCluster(): string {
        return Settings.fontSizeComponentCluster() ?? "10pt";
    }

    private getSolutionNode(solution: ISolution, asSubGraph: boolean = false, color?: string, isSelected?: boolean, stacked?: boolean, stackId?: string): IGraphvizNode {
        const labelInfo  = [
            (stacked ? `<${stackId ?? "f0"}>` : "") + `${solution.name}${solution.isManaged ? " (managed)" : ""}`,
            (stacked ? "{" : "")    + `v${solution.version ?? "0.0.0.0"} / ${solution.publisherName ?? "---"}` + (stacked ? "}" : "")
        ].filter(s => s);
        if (this.showIdsInLabel) { labelInfo.push(`${solution.solutionId}`); }
        const label      = `${labelInfo.join(stacked ? ' | ' : '\\n')}`;
        const tooltip    = `${label}`;
        const fillColor  = solution.isManaged ? "#eef5af" : "#ccdee0"; //"#9dcab9";
        const cssStyle   = `solution`;
        const properties = [`id="${solution.solutionId}"`, `label="${label}"`, `shape="${stacked ? "record" : "box"}"`, `fontname="sego ui"`, `fontsize="${this.fontSizeSolution()}"`, `style="filled"`, `class="${cssStyle}"`];
        if (isSelected || color) { 
            properties.push(`fillcolor="#fbfceb"`);
            properties.push(`color="#ccdee0"`); 
            properties.push(`penwidth=1.0`);
        }
        else {
            properties.push(`fillcolor="${fillColor}"`);
        }
        //`tooltip="${tooltip}"`


        
        return {
            id:    `${solution.solutionId}`,
            stackId: stackId ?? "f0",
            value: `${ asSubGraph ? properties.join(";\n   ") : properties.join(" ")}`,
            children: [],
            refId: solution.solutionId,
            solution: solution,
        };
    }

    private getComponentNode(component: IDataverseComponent, color: string = "#9dcab9", solution?: ISolution, stackId?: string): IGraphvizNode {
        const labelInfo  = [`<${stackId ?? "f0"}> ${component.displayName}`];
        if (! this.useClusteredComponents()) {
            labelInfo.push(`{${component.typeName} | ${component.type}}`);
        }
        if (this.showIdsInLabel) {
            labelInfo.push(`{${component.component?.solutionComponentId} | Component ID}`);
            labelInfo.push(`{${component.component?.id} | Object ID}`);
        }
        const label      = `${labelInfo.join('|')}`;
        const tooltip    = `${label}`;
        const fillColor  = this.getComponentColor(component.type) ?? color;
        const cssStyle   = `component`;
        const properties = [
            `id="${component.component?.solutionComponentId}"`,
            `label="${label}"`,
        //    `tooltip="${tooltip}"`,
            `shape="record"`,
            `penwidth=0.5`,
            `fontname="sego ui"`,
            `fontsize="${this.fontSizeComponent()}"`,
            `style="filled"`,
            `fillcolor="${fillColor}"`,
            `class="${cssStyle}"`];

        const value      = `[${properties.join(" ")}]`;
        
        return {
            id:    `${component.id}`,
            stackId: stackId ?? "f0",
            value: `${value}`,
            children: [],
            refId: component.component?.solutionComponentId,
            solution: solution,
            component: component.component,
        };
    }

    // TODO: Get Component Colors from Settings
    private getComponentColor(componentType: number): string {
        switch (componentType) {
            // Workflow
            case 29:  return "#72BDFD";
            // Sitemap
            case 62:
            // Canvas App
            case 300: return "#E696C9";
            
            // Connector
            case 371:    
            case 372: return "#85D887";

            // Connection-Reference
            case 10067:
            case 10248: return "#57C580";            
        }
        
        return "#9dcab9";
    }

    public getGraphD365ceForSolutions(solutions: ISolution[], dependencies: IDependency[]): string {
        const graph:      string[] = ["rankdir = LR;", "bgcolor = transparent;"];
        const references: string[] = [];
        const solutionNodes = [];
        for (const solution of solutions) {
            const solutionNode = this.getSolutionNode(solution, false, undefined, undefined, true);
            solutionNodes.push(solutionNode);
            graph.push(`"${solutionNode.id}" [${solutionNode.value}];`);            
        }

        for (const dependency of dependencies) {
            const depSolution     = solutionNodes.find(s => s.id === dependency.dependentComponentBaseSolutionId);
            const reqSolution     = solutionNodes.find(s => s.id === dependency.requiredComponentBaseSolutionId);
            if (depSolution === undefined || reqSolution === undefined) { continue; }
            
            const reference = `"${dependency.dependentComponentBaseSolutionId}"->"${dependency.requiredComponentBaseSolutionId}";`;
            if (! references.includes(reference)) {
                references.push(reference);
            }
        }

        for(const reference of references) {
            graph.push(reference);
        }

        return graph.join("\n");
    }

    private static getNodeId(solutionId: string, componentId?: string): string
    {
        if (componentId) { 
            return `cluster_${solutionId}_${componentId}`; 
        } else {
            return `cluster_${solutionId}`;
        }
    }

    public getGraphD365ceForDependencies(graphData: IGraphData): string {
        const solutions: ISolution[] = graphData.solutions;
        const dependencies: IDependency[] = graphData.dependencies;
        const selected: ISolution | undefined = graphData.selected;
        const graph: string[] = ["rankdir = LR;", "bgcolor = transparent;", "compound=true;"];
        const references: string[] = [];
        const solutionNodes : IGraphvizNode[] = [];
            
        // Create solution nodes
        for (const solution of solutions.filter(s => s === selected || dependencies.find(d => d.dependentComponentBaseSolutionId === s.solutionId || d.requiredComponentBaseSolutionId === s.solutionId) !== undefined)) {
            const solutionNode = this.getSolutionNode(solution, true, undefined, selected === solution);

            solutionNodes.push(solutionNode);
            solution.components.forEach(c => {
                const component = graphData.components.find(m => c.solutionComponentId === m.solutionComponentId);
                const dComponent = dependencies.find(d => d.dependentComponentName && d.dependentComponentObjectId === c.id);
                const msDynComponent = graphData.msDynComponents.find(m => [c.id, c.solutionComponentId, component?.solutionComponentId, component?.id].includes(m.id));                
                solutionNode.children.push(this.getComponentNode({
                    id:          RenderGraphService.getNodeId(solutionNode.refId, c.solutionComponentId),
                    displayName: msDynComponent?.name ?? dComponent?.dependentComponentName ?? component?.name ?? c.name,
                    typeName:    msDynComponent?.typeName ?? c.typeName ?? (c.type in graphData.typeNames ? graphData.typeNames[c.type] : `${c.type}`),
                    type:        msDynComponent?.type ?? c.type,
                    component:   c,
                    msDynComponent: msDynComponent,
                }));
            });
            if (solution.components.length === 0) {
                solution.msDynComponents.forEach(c => {
                    const component = graphData.components.find(m => c.id === m.solutionComponentId);
                    const dComponent = dependencies.find(d => d.dependentComponentName && d.dependentComponentObjectId === c.id);
                    const msDynComponent = graphData.msDynComponents.find(m => [c.id, c.id, component?.solutionComponentId, component?.id].includes(m.id));                
                    solutionNode.children.push(this.getComponentNode({
                        id:          RenderGraphService.getNodeId(solutionNode.refId, c.id),
                        displayName: msDynComponent?.name ?? dComponent?.dependentComponentName ?? component?.name ?? c.name,
                        typeName:    msDynComponent?.typeName ?? c.typeName ?? (c.type in graphData.typeNames ? graphData.typeNames[c.type] : `${c.type}`),
                        type:        msDynComponent?.type ?? c.type,
                        component:   component,
                        msDynComponent: msDynComponent,
                    }));
                });
            }
        }

        // Create Component Nodes and collect dependency references
        for (const dependency of dependencies) {    
            const depSolutionNodes = [...new Set((solutionNodes.filter(s => s.solution?.components.map(c => c.id).includes(dependency.dependentComponentObjectId)) || [])
                .concat(solutionNodes.filter(s => s.solution?.msDynComponents.map(c => c.id).includes(dependency.dependentComponentObjectId)) || []))];
            const reqSolutionNodes = [...new Set((solutionNodes.filter(s => s.solution?.components.map(c => c.id).includes(dependency.requiredComponentObjectId)) || [])
                .concat(solutionNodes.filter(s => s.solution?.msDynComponents.map(c => c.id).includes(dependency.requiredComponentObjectId)) || []))];
            if (depSolutionNodes.length === 0 || reqSolutionNodes.length === 0) { continue; }
            
            const depComponentNodeIds = depSolutionNodes
                .map(sn => ({ 
                    snId : sn.id, 
                    cpId : sn.solution?.components.find(c => c.id === dependency.dependentComponentObjectId)?.solutionComponentId
                        || sn.solution?.msDynComponents.find(c => c.id === dependency.dependentComponentObjectId)?.id
                    }))                  
                .filter(item => item.cpId)
                .map(item => RenderGraphService.getNodeId(item.snId, item.cpId));
                
            const reqComponentNodeIds = reqSolutionNodes
                .map(sn => ({ 
                    snId : sn.id, 
                    cpId : sn.solution?.components.find(c => c.id === dependency.requiredComponentObjectId)?.solutionComponentId
                        || sn.solution?.msDynComponents.find(c => c.id === dependency.requiredComponentObjectId)?.id
                }))
                .filter(item => item.cpId)
                .map(item => RenderGraphService.getNodeId(item.snId, item.cpId));
            
            depComponentNodeIds.forEach( depComponentNodeId => {
                reqComponentNodeIds.forEach(reqComponentNodeId => {
                    const reference = `"${depComponentNodeId}":f0->"${reqComponentNodeId}":f0;`;
                    if (! references.includes(reference)) {
                        references.push(reference);
                    };
                });
            });
        }
        
        for(const solutionNode of solutionNodes) {
            const subGraphNodes = solutionNode.children.map(n => `"${n.id}" ${n.value};`).join('\n   ');
            const types : {[key: number]: { type: number; name: string; items: IGraphvizNode[];}} = {};
            solutionNode.children.forEach(element => {
                const type = element.component?.type ?? 0;
                if (! (type in types)) { types[type] = { 
                        type: type, 
                        name: `${element.component?.typeName ?? type in graphData.typeNames ? graphData.typeNames[type] : `${type}`}`,
                        items: [],
                    };
                }
                types[type].items.push(element);
            });
                        
            const componentClusters = Object.entries(types).map(([key, item]) => [
                `subgraph "cluster_type_${solutionNode.refId}_${key}" {`, 
                `   label="${item.name}${item.name.endsWith('ss') ? 'es' : 's'}";`,
                `   fillcolor="${this.getComponentColor(item.type)}";`, 
                `   penwidth=0.5;`, 
                `   fontsize="${this.fontSizeComponentCluster()}";`,
                `   ${item.items.map(n => `"${n.id}" ${n.value};`).join('\n         ')}`, 
                `}`].join('\n      '));
            const graphItems = [`subgraph "${RenderGraphService.getNodeId(solutionNode.id)}" {`, 
            `   ${solutionNode.value};`, 
            this.useClusteredComponents() 
                ? `   ${componentClusters.join('\n   ')}`
                : `   ${subGraphNodes}`, 
            `}`];
            graph.push(graphItems.join("\n"));
        }

        for (const reference of references) {
            graph.push(reference);
        }

        return graph.join("\n");
    }

    
    async renderGraph(graph: string, engine = RenderEngine.dot): Promise<string | undefined> {
        try {
            const result = await this.renderGraphByGraphViz(graph, engine);
            if ((result ?? "").length > 0) {
                return result;
            }
        }
        catch { }

        try {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            var headers: any = { "Content-Type": "text/plain" };
            var url = Settings.getGraphVisualizationApi();
            if ((url || "") === "") {
                throw new Error(
                    "Please configure the Graph Visualization API in settings.json to use this feature. See https://github.com/dynamics365-community/vscode-dynamics365-tools/blob/master/README.md#graph-visualization-api for more details."
                );
            }

            const graphvizUrl = `${url.replace(/\/$/, "")}/render?engine=${engine}`;
            var response = await axios.default.post(graphvizUrl, graph, { headers: headers });

            if (response.data !== undefined && response.status === 200) {
                Application.log.info(`Graph rendered.`);
            }
            return response.data as string | undefined;
        } catch (err: any) {
            Application.ui.error(`Rendering graph failed.\n\n${err?.response?.data?.error?.message || err}`);
            await Application.ui.outputAsDocument(graph);
            return "Error during rendering";
        }

        return new Promise((resolve) => resolve(undefined));
    }

    async renderGraphByGraphViz(graph: string, engine = RenderEngine.dot): Promise<string | undefined> {
        
        //not working
        try {
            const { toStream } = await import('ts-graphviz/adapter');
            const options: any = {
                layout: `${engine}`
            };
            
            // Test the Graphviz Library
            try {
                await toStream(`digraph{ node [label="test"] }`, options);
            }
            catch {
                return undefined;
            }
            const stream = await toStream(`digraph{ ${graph} }`, options);
            
            return await this.streamToString(stream);
        } catch (err: any) {
            await Application.log.error(`Could not parse the Graph: ${err}\n${graph}`);
            return undefined;
        }
        return undefined;
    }    

    async streamToString(stream: NodeJS.ReadableStream): Promise<string> {
        const chunks: Array<any> = [];
        for await (let chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        return buffer.toString("utf-8");
    }        
}

