/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Event, Terminal, Progress, CancellationToken } from 'vscode';
import { ServiceClientCredentials } from 'ms-rest';
import { ReadStream } from 'fs';
import { Environment } from '@azure/ms-rest-azure-env';

export type AzureLoginStatus = 'Initializing' | 'LoggingIn' | 'LoggedIn' | 'LoggedOut';

export interface AzureAccount {
    readonly status: AzureLoginStatus;
    readonly onStatusChanged: Event<AzureLoginStatus>;
    readonly waitForLogin: () => Promise<boolean>;
    readonly sessions: AzureSession[];
    readonly onSessionsChanged: Event<void>;
    readonly onSubscriptionsChanged: Event<void>;
    readonly waitForSubscriptions: () => Promise<boolean>;
    readonly onFiltersChanged: Event<void>;
    readonly waitForFilters: () => Promise<boolean>;
    createCloudShell(os: 'Linux' | 'Windows'): CloudShell;
}

export interface AzureSession {
    readonly environment: Environment;
    readonly userId: string;
    readonly tenantId: string;

	/**
	 * The credentials object for azure-sdk-for-node modules https://github.com/azure/azure-sdk-for-node
	 */
    readonly credentials: ServiceClientCredentials;
}

export type CloudShellStatus = 'Connecting' | 'Connected' | 'Disconnected';

export interface UploadOptions {
    contentLength?: number;
    progress?: Progress<{ message?: string; increment?: number }>;
    token?: CancellationToken;
}

export interface CloudShell {
    readonly status: CloudShellStatus;
    readonly onStatusChanged: Event<CloudShellStatus>;
    readonly waitForConnection: () => Promise<boolean>;
    readonly terminal: Promise<Terminal>;
    readonly session: Promise<AzureSession>;
    readonly uploadFile: (filename: string, stream: ReadStream, options?: UploadOptions) => Promise<void>;
}