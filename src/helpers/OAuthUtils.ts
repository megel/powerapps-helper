import * as vscode from 'vscode';
import { AzureAccount, AzureSession } from '../azure-account.api';
import { MemoryCache, AuthenticationContext } from 'adal-node';
import { TokenResponse } from "ms-rest-azure";

/** The clientId of the calling Application */
const vsCodeClientId = 'aebc6443-996d-45c2-90f0-388ff96faa56';  //VSC

/** The OAuth token information */
interface OAuthToken {
	session: 		AzureSession;
	accessToken: 	string;
	refreshToken: 	string;
}

/** Utils to get a OAuth / Bearer token for API calls */
export class OAuthUtils {

	private static tokenCache: Map<string, TokenResponse> = new Map<string, TokenResponse>();

	/** Get OAuth / Bearer token for 'https://service.powerapps.com/' API */
	public static async getPowerAppAPIToken(): Promise<string | undefined> {
		return await OAuthUtils.acquireToken('https://service.powerapps.com/');
	}

	/**
	 * Acquire a OAuth Token for the audience and optional tenant
	 * @param resource (mandatory) — The OAuth resource for which a token is being request. This parameter is optional and can be set to null.
	 * @param tenantId (optional)
	 */
	private static async acquireToken(resource: string, tenantId: string = ''): Promise<string | undefined> {
		const key = [resource, tenantId].join("|");
		var token = OAuthUtils.tokenCache.get(key);
		if (token === undefined) {
			token = await OAuthUtils.requestToken(resource, tenantId);
		}
		if (token !== undefined) {
			OAuthUtils.tokenCache.set(key, token);
			
			// request a new token, when expired
			if ((new Date(token.expiresOn)).getTime() <= Date.now()) {
				token = await OAuthUtils.requestToken(resource, tenantId);				
			}			
		}
		return token !== undefined ? token.accessToken : undefined; 
	}


	/**
	 * Request a new OAuth Token for the audience and optional tenant
	 * @param resource (mandatory) — The OAuth resource for which a token is being request. This parameter is optional and can be set to null.
	 * @param tenantId (optional) — The optional tenant id.
	 */
	private static async requestToken(resource: string, tenantId: string): Promise<TokenResponse | undefined> {
		// Get the Azure Account from 'ms-vscode.azure-account' extension.
		const azureAccount = vscode.extensions.getExtension<AzureAccount>('ms-vscode.azure-account')!.exports;
		if (!(await azureAccount.waitForLogin())) {
			await vscode.commands.executeCommand('azure-account.login');
		}

		if (azureAccount.sessions.length === 0) {
			vscode.window.showErrorMessage(`Azure Login failed.`);
			return;
		}
	
		const session = azureAccount.sessions[0];
		
		try {
			// acquire the token with Promise
			var token  = await new Promise<OAuthToken>((resolve, reject) => {
				const credentials: any = session.credentials;
				const environment: any = session.environment;
				
				credentials.context.acquireToken(environment.activeDirectoryResourceId, credentials.username, credentials.clientId, function (err: any, result: any) {
					if (err) {
						reject(err);
					} else {
						resolve({
							session,
							accessToken:  result.accessToken,
							refreshToken: result.refreshToken
						});
					}
				});
			});

			// ensure the token is working --> refresh the token with Promise
			return await new Promise<TokenResponse>((resolve, reject) => {
				const tokenCache = new MemoryCache();
				const context    = new AuthenticationContext(`${session.environment.activeDirectoryEndpointUrl}${tenantId || session.tenantId}`, true, tokenCache);
				context.acquireTokenWithRefreshToken(token.refreshToken, vsCodeClientId, <any>resource, (err, tokenResponse) => {
					if (err) {
						reject(`Acquiring token for resource: '${resource}' with refresh token failed`);
					} else if (tokenResponse.error) {
						reject(`Acquiring token for resource: '${resource}' with refresh token failed`);
					} else {
						resolve(<TokenResponse>tokenResponse);
					}
				});
			});
		} catch (error) {
			// handle tokenPromise reject(..)
			vscode.window.showErrorMessage(`${error}`);
			vscode.commands.executeCommand('mme2k-powerapps-helper.refreshEntry');
			return undefined;
		}
	}
}