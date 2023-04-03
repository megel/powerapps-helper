# PowerApps Helper VSCode Extension

The **PowerApps Helper** VSCode Extension help you to download & upload Solutions and PowerApps from your PowerApp Environment. Furthermore, the extension uses **[Power Platform Cli](https://docs.microsoft.com/en-us/powerapps/developer/data-platform/powerapps-cli)** from Microsoft to extract as Canvas Apps downloaded in `msapp` (Archive) format well as to pack the extracted source code into `msapp` format for the upload.

## Features

The added view "Power Apps Environments" provides information about your Power Apps Environments.

* List of "Power Apps Environments"
  * "Solutions" contains the Crm solutions of related environment.
    * "Entities" contains entity information included in related solution
      * "Columns" contains column / field information included in this entity
    * "Canvas Apps" contains Canvas Apps included in related solution
    * "Model Driven Apps" contains Model Driven Apps included in related solution
    * "Flows" contains modern Workflows included in related solution
    * "Connectors" contains Connectors included in related solution
  * "Canvas Apps" contains all Crm Canvas Apps of the environment
  * "Model Driven Apps" contains Model Driven Apps included of the environment
  * "Flows" contains all Crm modern Workflows of the environment
  * "Connectors" contains all Connectors of the environment
  * "[Power Apps](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-apps)" of the environment. Note: These Power Apps are not part of solutions or Crm.
    * "[Power App Versions](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-app-versions)" of the environment. Note: These Power Apps are not part of solutions or Crm.
  * "[Power Apps APIs](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-connectors)" of the environment. Note: These are your Custom APIs from related Power Apps environment.

### Commands

* Command **"Power Apps: Download and Unpack Solution"**, which download and extract the solution into "source folder"
* Command **"Power Apps: Pack Solution"**, which creates a Solution-Zip ready for import in the "output folder"
* Command **"Power Apps: Pack and Upload Solution"**, which import the solution into a Crm Environment
* Command **"Power Apps: Download and Unpack Power App"** extract the Downloaded App in the folder `<SourceFolder>/CanvasApps/<PowerAppName>_msapp_src`
* Command **"Publish Customizations"** publish the changes of a Solution, CanvasApp, Connector, Workflow in the related Crm Environment
* Command **"Power Apps: Visualize Dataverse Environments"** collect dependency information of all solutions in this environment and render a [Graphviz](https://graphviz.org/) graph.

The extension adds the PowerApps View to VSCode, which gets a list of your PowerApps Environments from **[PowerApps API](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-connectors)**

![PowerApps View](./doc/powerapps-environments.png?raw=true)

Use the [PowerApps-Language-Tooling](https://github.com/microsoft/PowerApps-Language-Tooling) to  **Downloaded and Unpack Solutions** to your local project:

![Download and Unpack Solution](./doc/download-solution.png?raw=true)

You can [PowerApps-Language-Tooling](https://github.com/microsoft/PowerApps-Language-Tooling) as well to **Downloaded and Unpack a PowerApp**  to your local project. This makes sense, when you want to add manual a Canvas App to your solution.

![Download and Unpack App](./doc/download-app.png?raw=true)

As result you get your PowerApp sources as follows:

![PowerApp Sources](./doc/powerapp-sources.png?raw=true)

## Tooltips

The PowerApps Helper VSCode extension provides also a couple of useful information as well as links. Here is an example:

![Environment](./doc/env-tooltip.png?raw=true)

## Requirements

This extension uses the PowerApps API to excess your PowerApps Environment:

1. [PowerApps for App Makers - Get Apps](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-apps) to provide PowerApp information to the VSCode Extension PowerApps Tree
1. [PowerApps for App Makers - Get App Versions](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-app-versions) to provide PowerApp Version information to the VSCode Extension PowerApps Tree

Furthermore, it uses the [PowerApps-Language-Tooling](https://github.com/microsoft/PowerApps-Language-Tooling) to extract the PowerApp from `msapp` (Archive) format into `YAML`. Read more about this on: [Source code files for Canvas apps](https://powerapps.microsoft.com/en-us/blog/source-code-files-for-canvas-apps/). This is done by referencing [Power Platform Extension](https://github.com/microsoft/powerplatform-vscode) from Microsoft and using the included/installed PAC CLI. It is installed in Windows underneath `c:\Users\<YOUR USERNAME>\AppData\Roaming\<VS CODE FOLDER>\User\globalStorage\microsoft-isvexptools.powerplatform-vscode\pac\tools\`.

Finally, [Azure Account](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) VS-Code extension is required to acquire a Bearer Token for the PowerApps API requests.

### Power Apps

The PowerApps are provided by PowerApps API: `https://api.powerapps.com/providers/Microsoft.PowerApps/apps/?api-version=2020-07-01`

A documentation can be found at:

[PowerApps for App Makers - Get Apps](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-apps)

### Power App Versions

The PowerApp Versions are provided by PowerApps API: `https://api.powerapps.com/providers/Microsoft.PowerApps/apps/{app}/versions?api-version=2020-07-01`

A documentation can be found at:

[PowerApps for App Makers - Get App Versions](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-app-versions)

### Power Apps APIs

The Power Apps APIs are provided by Power Apps for Makers API: `https://api.powerapps.com/providers/Microsoft.PowerApps/apis/{connector}?$filter=environment eq '{environmentName}'&api-version=2020-07-01`

A documentation can be found at:

[PowerApps for App Makers - Get Connectors](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-connectors)

## Extension Settings

This extension contributes the following settings:

* `mme2k-powerapps-helper.PowerPlatformCli`: Microsoft **[Power Platform Cli](https://docs.microsoft.com/en-us/powerapps/developer/data-platform/powerapps-cli)** to pack and unpack Canvas Apps.\n\n*Download: [Power Platform Cli](https://aka.ms/PowerAppsCLI)*.
* `mme2k-powerapps-helper.SourceFolder`: Source Code Folder to extract the PowerApp
* `mme2k-powerapps-helper.OutputFolder`: Output Folder for the packed PowerApp
* `mme2k-powerapps-helper.MaxVisibleVersions`: Count of shown PowerApp versions
* `mme2k-powerapps-helper.CacheAPIConnectionSecrets`: Cache secrets for API Connections (OAuth Settings, ...)
* `mme2k-powerapps-helper.APIConnectionSettings`: API Connection Settings (OAuth Settings, ...)
* `mme2k-powerapps-helper.UseCrmSolutionPacker`: Use the CrmSdk CoreTools Solution-Packer tool for solution packing and unpacking
* `mme2k-powerapps-helper.SolutionFolderName`: Define the root folder structure for solutions. These vars can be used: `<SourceFolder>`, `<SolutionName>`
* `mme2k-powerapps-helper.GraphVisualizationApi`: URL for graph visualization API, if you don't have [Graphviz](https://graphviz.org/) installed on your local machine.
* `mme2k-powerapps-helper.Graph-ShowIdsInLabel`: Specifies whether to show IDs in the label.
* `mme2k-powerapps-helper.Graph-ClusteredComponents`: Specifies whether to cluster components.
* `mme2k-powerapps-helper.Graph-FontSizeSolution`: Specifies the font size for solutions e.g.: `12pt`.
* `mme2k-powerapps-helper.Graph-FontSizeComponent`: Specifies the font size for components e.g.: `11pt`.
* `mme2k-powerapps-helper.Graph-FontSizeComponentCluster`: Specifies the font size for clustered components e.g.: `10pt`.

![Settings](./doc/powerapps-settings.png?raw=true)

### API Connection Settings (OAuth Settings, ...)

Uses this setting to avoid a reentering of `ClientId` and/or `TenantId` for each Custom Connectors in a new Crm-Environment. You can specify the used `ClientId` and/or `TenantId` for **"Update OAuth Settings"** for Custom Connectors by:

```json
{
   "mme2k-powerapps-helper.APIConnectionSettings": {
        // Environment name where the setting is used
        "Default-525232c0-41a9-4573-9484-8b571b4691c2": {
            // "Xrm-ConnectorId.Authentication": ... "3a4b7fd3-f303-4269-b1ac-91ec8ef15a06.oauth.aad"
            //   or
            // "Authentication" ... "oauth.aad"
            "oauth.aad": {
                "clientId": "10996272-a6ac-425f-933f-17ae3f5f6724", // overrule the clientId
                "tenantId": "abce06a2-ff58-48b6-9ca0-ca4d8608f2d6"  // overrule the tenantId, when tenantId != common
            }
        }
  }
}
```

***Note:*** Use the tooltips of **Environment** and **Custom Connector** to get the needed information for the setting.

### Visualize Dataverse Environments

**Note:** You need [Graphviz](https://graphviz.org/) for this feature installed on your local machine or a microservice including a rendering API (details coming soon).

To use this feature, run **"Power Apps: Visualize Dataverse Environments"** from command pallet or open by clicking on an environment or a solution:
![Settings](./doc/env-visualization.png?raw=true)

**Visualize Dataverse Environments** collects information about solutions and their dependencies from the selected environment. This might take a while.
Afterwards, all solutions are shown in this overview:
![Settings](./doc/env-visualization-overview.png?raw=true)

Use this list to select / unselect solutions for the graph rendering. To render an overview graph, press: "Solution Graph". As result, all selected solutions and their component dependencies are shown:
![Settings](./doc/env-visualization-overview-graph.png?raw=true)

Clicking on a solution opens a detailed view of its dependencies to other / from other solutions.
![Settings](./doc/env-visualization-components-graph.png?raw=true)

I hope you like this new feature. Please provide feedback or contribute here on Github!

## Known Issues

* Only Download of Published PowerApps possible (Versions Download Url run into an Authentication Issue)
* no Upload of packed PowerApp, because there is no API

## Release Notes

The extension is currently in development.

[Change Log](./CHANGELOG.md)
