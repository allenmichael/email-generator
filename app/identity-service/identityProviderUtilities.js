'use strict';
const config = require('config');
const BoxOptions = config.get('BoxOptions');
const Auth0Config = config.get('Auth0Config');
const Promise = require('bluebird');
const asyncFunc = Promise.coroutine;
const request = require('request');
const url = require('url');
Promise.promisifyAll(request);

class IdentityProviderUtilities {
  static normalizeAppMetadataOnProfile(profile) {
    let appMetadata = profile._json.app_metadata || {};
    profile.app_metadata = appMetadata;
    return profile;
  }

  static checkForExistingBoxAppUserId(profile) {
    return (profile && profile.app_metadata && profile.app_metadata[BoxOptions.boxAppUserIdFieldName]) ? profile.app_metadata[BoxOptions.boxAppUserIdFieldName] : null;
  }

  static checkForExistingBoxStorageFolderId(profile) {
    return (profile && profile.app_metadata && profile.app_metadata[BoxOptions.boxStorageFolderFieldName]) ? profile.app_metadata[BoxOptions.boxStorageFolderFieldName] : null;
  }

  static checkForVerifiedEmail(profile) {
    console.log("Where is email...");
    console.log(profile);
    return (profile && profile._json && profile._json.email_verified); 
  }

  static constructLogoutUrl() {
    return url.format(`${Auth0Config.logoutUrl}?returnTo=${encodeURIComponent(Auth0Config.logoutReturnUrl)}&client_id=${encodeURIComponent(Auth0Config.clientId)}`);
  }

  static retrieveManagementToken() {
    return asyncFunc(function* () {
      let options = {
        url: `https://${Auth0Config.domain}/oauth/token`,
        headers: { 'content-type': 'application/json' },
        body:
        {
          grant_type: 'client_credentials',
          client_id: Auth0Config.managementAPIClientId,
          client_secret: Auth0Config.managementAPIClientSecret,
          audience: `https://${Auth0Config.domain}/api/v2/`
        },
        json: true
      };
      console.log("Retrieving token...");
      let token = yield request.postAsync(options);
      console.log(`Token: ${token.body}`);
      console.log(token.body);
      return token.body;
    })();
  }
}

module.exports = IdentityProviderUtilities;