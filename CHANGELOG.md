# Change Log

All notable changes to the "mme2k-powerapps-helper" extension will be documented in this file.

## 0.3.1

* New command **"Publish Customizations"** added for Solution, CanvasApp, Connector, Workflow
* optional **"Publish Customizations"** included in "Download and Unpack Solution" procedure

## 0.3.0

* Solution Management added
* New source folder structure, based on a unpacked solution.
* View PowerApps changed into "Power Apps Environments" with nodes for:
  * "Solutions" contains the Crm solutions of related environment.
    * "Canvas Apps" contains Canvas Apps included in related solution
    * "Flows" contains modern Workflows included in related solution
    * "Connectors" contains Connectors included in related solution
  * "Canvas Apps" contains all Crm Canvas Apps of the environment
  * "Flows" contains all Crm modern Workflows of the environment
  * "Connectors" contains all Connectors of the environment
  * "Power Apps" from *Power Apps for Makers* of the environment. Note: These Power Apps are not part of solutions or Crm.
  * "Power Apps APIs" from *Power Apps for Admins* of the environment. Note: These are your Custom APIs from related Power Apps environment.
* New and changed commands:
  * New command **"Download and Unpack Solution"**, which download and extract the solution into "source folder"
  * New command **"Pack Solution"**, which creates a Solution-Zip ready for import in the "output folder"
  * New command **"Pack and Upload Solution"**, which import the solution into a Crm Environment
  * Command **"Download and Unpack Power App"** extract the Downloaded App in the folder `<SourceFolder>/CanvasApps/<PowerAppName>_msapp_src`

## 0.2.0

* Documentation updated (images corrected)

## 0.1.2

* Test Release

## 0.1.1

* Test Release

## 0.1.0

* PowerAutomate Flow calls replaced by API calls
* PowerApps versions added to the tree.
* New command `Open PowerApps Designer` added
* New command `Open PowerApps Player` added
* New command `Pack PowerApp` added

## 0.0.1

Initial Working Preview
