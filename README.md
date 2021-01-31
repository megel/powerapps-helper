# Powerapps-Helper VSCode Extension

This is the README for the "mme2k-powerapps-helper" extension.

## Features

The extension adds the PowerApps View to VSCode, which gets a list of your PowerApps from **[PowerApps API](#PowerApps)**

![PowerApps View](https://github.com/megel/powerapps-helper/blob/main/doc/powerapps-view.png)

Use the [PowerApps-Language-Tooling](https://github.com/microsoft/PowerApps-Language-Tooling) to  downloaded and Unpack PowerApp to your local project:

![Download and Unpack App](https://github.com/megel/powerapps-helper/blob/main/doc/download-app.png)

As result you get your PowerApp sources as follows:

![PowerApp Sources](https://github.com/megel/powerapps-helper/blob/main/doc/powerapp-sources.png)

## Requirements

This extension uses the PowerApps API to excess your PowerApps Environment:

1. [PowerApps for App Makers - Get Apps](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-apps) to provide PowerApp information to the VSCode Extension PowerApps Tree
1. [PowerApps for App Makers - Get App Versions](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-app-versions) to provide PowerApp Version information to the VSCode Extension PowerApps Tree

Furthermore, you need to download and compile the [PowerApps-Language-Tooling](https://github.com/microsoft/PowerApps-Language-Tooling) to extract the PowerApp from `msapp` (Archive) format into `YAML`. Read more about this on: [Source code files for Canvas apps](https://powerapps.microsoft.com/en-us/blog/source-code-files-for-canvas-apps/)

Finally, [Azure Account](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) VS-Code extension is required to acquire a Bearer Token for the PowerApps API requests.

### PowerApps

The PowerApps are provided by PowerApps API: `https://api.powerapps.com/providers/Microsoft.PowerApps/apps/?api-version=2020-07-01`

A documentation can be found at:

[PowerApps for App Makers - Get Apps](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-apps)

### PowerApp Versions

The PowerApp Versions are provided by PowerApps API: `https://api.powerapps.com/providers/Microsoft.PowerApps/apps/{app}/versions?api-version=2020-07-01`

A documentation can be found at:

[PowerApps for App Makers - Get App Versions](https://docs.microsoft.com/en-us/connectors/powerappsforappmakers/#get-app-versions)

## Extension Settings

This extension contributes the following settings:

* `mme2k-powerapps-helper.SourceFileUtility`: Path to the [PowerApps-Language-Tooling](https://github.com/microsoft/PowerApps-Language-Tooling) binary (`PASopa.exe`)
* `mme2k-powerapps-helper.SourceFolder`: Source Code Folder to extract the PowerApp
* `mme2k-powerapps-helper.OutputFolder`: Output Folder for the packed PowerApp
* `mme2k-powerapps-helper.MaxVisibleVersions`: Count of shown PowerApp versions

![Settings](https://github.com/megel/powerapps-helper/blob/main/doc/powerapps-settings.png)

## Known Issues

* Only Download of Published PowerApps possible (Versions Download Url run into an Authentication Issue)
* no Upload of packed PowerApp, because there is no API

## Release Notes

The extension is currently in development.

[Change Log](./CHANGELOG.md)
