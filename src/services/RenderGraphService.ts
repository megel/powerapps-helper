import { optional, singleton } from "aurelia-dependency-injection";
import { Settings } from "../helpers/Settings";
import * as axios from "axios";
import { Application } from "../Application";
import * as vscode from 'vscode';

export interface ISolution {
    solutionId: string;
    name: string;
    version: string;
    isManaged: boolean;
    publisherId: string;
    publisherName: string;
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
    value: any;
    children: IGraphvizNode[];
}

interface IDataverseComponent {
    id:          string;
    displayName: string;
    typeName:    string;
    type:        number;
}

@singleton(true)
export class RenderGraphService {

    private getSolutionNode(solution: ISolution, asSubGraph: boolean = false, color: string = "#eef5af"): IGraphvizNode {
        const label      = `${solution.name}\\n${solution.publisherName}\\n${solution.version} (${solution.isManaged ? "managed" : "unmanaged"})`;
        const tooltip    = `${label}`;
        const fillColor  = solution.isManaged ? color : "#ccdee0"; //"#9dcab9";
        const cssStyle   = `solution`;
        const properties = [`id="${solution.solutionId}"`, `label="${label}"`, `shape="box"`, `fontname="sego ui"`, `style="filled"`, `fillcolor="${fillColor}"`, `class="${cssStyle}"`];
        //`tooltip="${tooltip}"`
        
        return {
            id:    `${solution.solutionId}`,
            value: `${ asSubGraph ? properties.join(";\n   ") : properties.join(" ")}`,
            children: []
        };
    }

    private getComponentNode(component: IDataverseComponent, color: string = "#9dcab9"): IGraphvizNode {
        const label      = `${component.displayName}\\n${component.typeName} (Type: ${component.type})`;
        const tooltip    = `${label}`;
        const fillColor  = this.getComponentColor(component.type) ?? color;
        const cssStyle   = `component`;
        const value      = `[id="${component.id}" label="${label}" tooltip="${tooltip}" shape="box" fontname="sego ui" style="filled" fillcolor="${fillColor}" class="${cssStyle}"]`;
        
        return {
            id:    `${component.id}`,
            value: `${value}`,
            children: []
        };
    }

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
            const solutionNode = this.getSolutionNode(solution);
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

    public getGraphD365ceForDependencies(solutions: ISolution[], dependencies: IDependency[], selected: ISolution): string {
        const graph: string[] = ["rankdir = LR;", "bgcolor = transparent;", "compound=true;"];
        const references: string[] = [];
        const solutionNodes : IGraphvizNode[] = [];

        // Create solution nodes
        for (const solution of solutions.filter(s => dependencies.find(d => d.dependentComponentBaseSolutionId === s.solutionId || d.requiredComponentBaseSolutionId === s.solutionId) !== undefined)) {
            const solutionNode = this.getSolutionNode(solution, true, selected === solution ? "#9dcab9" : undefined);

            solutionNodes.push(solutionNode);
        }

        // Create Component Nodes and collect dependency references
        for (const dependency of dependencies) {
            const depSolutionNode = solutionNodes.find(s => s.id === dependency.dependentComponentBaseSolutionId);
            const reqSolutionNode = solutionNodes.find(s => s.id === dependency.requiredComponentBaseSolutionId);
            if (depSolutionNode === undefined || reqSolutionNode === undefined) { continue; }

            const depComponentNode = depSolutionNode?.children.find(n => n.id === dependency.dependentComponentObjectId) 
                ?? this.getComponentNode({
                    id:          dependency.dependentComponentObjectId,
                    displayName: dependency.dependentComponentDisplayName,
                    typeName:    dependency.dependentComponentTypeName,
                    type:        dependency.dependentComponentType,
                });
            
            const reqComponentNode = reqSolutionNode?.children.find(n => n.id === dependency.requiredComponentObjectId)
                ?? this.getComponentNode({
                    id:          dependency.requiredComponentObjectId,
                    displayName: dependency.requiredComponentDisplayName,
                    typeName:    dependency.requiredComponentTypeName,
                    type:        dependency.requiredComponentType,
                });

            if (! depSolutionNode.children.includes(depComponentNode)) {
                depSolutionNode.children.push(depComponentNode);                
            }
            if (! reqSolutionNode.children.includes(reqComponentNode)) {
                reqSolutionNode.children.push(reqComponentNode);
            }
            
            const reference = `"${dependency.dependentComponentObjectId}"->"${dependency.requiredComponentObjectId}";`;
            if (! references.includes(reference)) {
                references.push(reference);
            }
        }
        
        for(const solutionNode of solutionNodes) {
            const subGraphNodes = solutionNode.children.map(n => `"${n.id}" ${n.value};`).join('\n   ');
            graph.push([`subgraph "cluster_${solutionNode.id}" {`, `   ${solutionNode.value};`, `   ${subGraphNodes}`, `}`].join("\n"));
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

