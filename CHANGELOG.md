# Change Log

All notable changes to the "mme2k-powerapps-helper" extension will be documented in this file.

## 1.8.2

- Max Body Length for solution upload set to 100mb [#20](https://github.com/megel/powerapps-helper/issues/20)

## 1.8.1

- Entity information improved (columns added)
- Package keywords improved
- minor documentation fixes
- tooltips improved (Links to Solution Designer added)

## 1.8.0

- Version increased, because of tagging issue in Github :)
- Fixed: Canvas Apps, Flows & Connectors weren't loaded when expanding a solution in tree view
- Tooltip & Display name improved for Environments
- Added: New dataverse information added:
  - Model Driven Apps
  - Entities

## 0.7.1

- Dependencies to Crm Solution Packer Tool removed, because this functionality is now part of Power Platform Cli.

## 0.7.0

- PowerApps Helper reference now [Power Platform Extension](https://github.com/microsoft/powerplatform-vscode) from Microsoft and use the included/installed PAC CLI. It is installed e.g. in Windows underneath `c:\Users\<YOUR USERNAME>\AppData\Roaming\<VS CODE FOLDER>\User\globalStorage\microsoft-isvexptools.powerplatform-vscode\pac\tools\`.
- Usage of 'keytar' wrapped into try-catch to support MacOS

## 0.6.5

- Rebuild for Power Platform Cli (1.9.4)

## 0.6.4

- Use correct login method for VS Code Azure Account extension

## 0.6.3

- Improve description in Download and Unpack "quick pick" dialog [see PR #7](https://github.com/megel/powerapps-helper/pull/7)
- Correct message to "unpacked" rather than "packed" [see PR #6](https://github.com/megel/powerapps-helper/pull/6)
- Comment unused webpack dependencies in gulpfile [see PR #10](https://github.com/megel/powerapps-helper/pull/10)
- Update Microsoft.PowerApps.CLI to 1.8.5 [see PR #10](https://github.com/megel/powerapps-helper/pull/10)
- Fix environment comparison case sensitivity [see PR #10](https://github.com/megel/powerapps-helper/pull/10)

*Thanks for contributing [Chris P](https://github.com/Chris-WP) & [Ioannis Kappas](https://github.com/ikappas)*

## 0.6.2

- Support the new workspace trust feature of Visual Studio Code ([more](https://code.visualstudio.com/docs/editor/workspace-trust))
- Tooltips for PowerApps improved
- Fixed: Exception during download PowerApps to empty folder.
- Fixed: Unexpected error, when export request was canceled.
- Changed: PowerApps (.msapp) download improved.
- Tree labels display now the origin of node content like `(Dataverse)`

## 0.6.1

- Fixed: Tests corrected.
- Supported OS changed to Windows in due too tooling dependencies.

## 0.6.0

- Fixed: Problem with unpacking solutions - missing parameter added to delete the existing sources.
- Changed: PawerApps Solution Packer replaced by [Power Platform Cli](https://docs.microsoft.com/en-us/powerapps/developer/data-platform/powerapps-cli). Canvas Apps are now packed/unpacked with this tooling
- Changed: Unnecessary git changes avoided, by using pretty print JSON which include sort of elements.

## 0.5.0

- Fixed: Error on Pack Workspace Solution, when no CanvasApps folder was present.
- Extension supports now multiple solutions in Source Folder. The folder name depends on setting `mme2k-powerapps-helper.SolutionFolderName`.
- Prepared support for [Microsoft CoE ALM Starter-Kit Solutions](https://github.com/microsoft/coe-starter-kit) (Repository structure, Solution Packer, Multi-Solution-Repo, ...)
- Crm Solution Packer from [Microsoft.CrmSdk.CoreTools](https://www.nuget.org/packages/Microsoft.CrmSdk.CoreTools) is now included (only Windows supported)
- New setting `mme2k-powerapps-helper.CoreToolsSolutionPackager` added. This setting specify the path to the [Microsoft CrmSdk CoreTools Solution-Packer](https://www.nuget.org/packages/Microsoft.CrmSdk.CoreTools) binary (`SolutionPacker.exe`) tool to pack and unpack solutions.
- New setting `mme2k-powerapps-helper.UseCrmSolutionPacker` added (default: `true`). This setting allow to use the CrmSdk CoreTools Solution-Packer tool for solution packing and unpacking instead of Zip. ***Note:*** *This might result in a different solution folder structure.*
- New setting `mme2k-powerapps-helper.SolutionFolderName` added, to define the root folder structure for solutions. These vars can be used: `<SourceFolder>`, `<SolutionName>`. The default is `<SourceFolder>/<SolutionName>`
- New command `Check Solution Packer Utility` added, to check the availability of the [Microsoft CrmSdk CoreTools Solution-Packer](https://www.nuget.org/packages/Microsoft.CrmSdk.CoreTools).
- Output window `Power Apps Helper` added to log output of used command line tools.
- Fixed: All OAuth connectors were presented for solution import for update `OAuth Settings`. This happened also when the solution did not contains one of them.
- Selection of API added, when `Update OAuth Settings` is called as command

## 0.4.0

- Improved tooltips for tree nodes.
- Improved usability, when updating OAuth settings.
- New setting, which allows to specify CustomConnector authentication settings for environments.
- Solution import asks now for update OAuth settings for all CustomConnectors of the solution.
- Command **"Update OAuth Settings"** is now available for a solution to update all CustomConnectors (OAuth) of the solution. This makes a solution import much more comfortable.
- Command **"Publish Customizations"** call now the Crm action `PublishAllXml`

## 0.3.5

- Fix: Wrong cached client secret was used, when the client id changed during input of Update OAuth Settings
- Refresh clear now the cached information
- Solution Import allows now to specify the import version
- Solution Import allows now to specify the import type: managed or unmanaged

## 0.3.4

- Binaries of [PowerApps-Language-Tooling](https://github.com/microsoft/PowerApps-Language-Tooling) are now included in extension.

## 0.3.3

- Caching secrets for API Connections e.g. `Update OAuth Settings` added.
- New command `Clear Credential Cache` added to clear the cached credentials.
- New setting `mme2k-powerapps-helper.CacheAPIConnectionSecrets` added to disable credential caching (default: *Cache secrets for API Connections (OAuth Settings, ...) is **enabled***)
- Command `Import Solution` renamed into `Pack and Upload Workspace Solution (Import Solution)`.
- Command `Pack Solution` renamed into `Pack Workspace Solution`.
- Notifications during long running operations improved.

## 0.3.2

- Documentation regarding dependency of [PowerApps-Language-Tooling](https://github.com/microsoft/PowerApps-Language-Tooling) improved.
- Error message added, when [PowerApps-Language-Tooling](https://github.com/microsoft/PowerApps-Language-Tooling) `PASopa.exe` cannot be found.

## 0.3.1

- New command **"Publish Customizations"** added for Solution, CanvasApp, Connector, Workflow
- optional **"Publish Customizations"** included in "Download and Unpack Solution" procedure

## 0.3.0

- Solution Management added
- New source folder structure, based on a unpacked solution.
- View PowerApps changed into "Power Apps Environments" with nodes for:
  - "Solutions" contains the Crm solutions of related environment.
    - "Canvas Apps" contains Canvas Apps included in related solution
    - "Flows" contains modern Workflows included in related solution
    - "Connectors" contains Connectors included in related solution
  - "Canvas Apps" contains all Crm Canvas Apps of the environment
  - "Flows" contains all Crm modern Workflows of the environment
  - "Connectors" contains all Connectors of the environment
  - "Power Apps" from *Power Apps for Makers* of the environment. Note: These Power Apps are not part of solutions or Crm.
  - "Power Apps APIs" from *Power Apps for Admins* of the environment. Note: These are your Custom APIs from related Power Apps environment.
- New and changed commands:
  - New command **"Download and Unpack Solution"**, which download and extract the solution into "source folder"
  - New command **"Pack Solution"**, which creates a Solution-Zip ready for import in the "output folder"
  - New command **"Pack and Upload Solution"**, which import the solution into a Crm Environment
  - Command **"Download and Unpack Power App"** extract the Downloaded App in the folder `<SourceFolder>/CanvasApps/<PowerAppName>_msapp_src`

## 0.2.0

- Documentation updated (images corrected)

## 0.1.2

- Test Release

## 0.1.1

- Test Release

## 0.1.0

- PowerAutomate Flow calls replaced by API calls
- PowerApps versions added to the tree.
- New command `Open PowerApps Designer` added
- New command `Open PowerApps Player` added
- New command `Pack PowerApp` added

## 0.0.1

Initial Working Preview
