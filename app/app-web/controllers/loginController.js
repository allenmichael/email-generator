'use strict';
const Promise = require('bluebird');
const asyncFunc = Promise.coroutine;
const config = require('config');
const Auth0Config = config.get('Auth0Config');
const BoxOptions = config.get('BoxOptions');
const AppConfig = config.get('AppConfig');

let Box = require('../../box-service/boxClientService');
let IdentityProvider = require('../../identity-service/identityProvider');
let IdentityProviderUtilities = require('../../identity-service/identityProviderUtilities');
let loginEnv = {
	AUTH0_CLIENT_ID: Auth0Config.clientId,
	AUTH0_DOMAIN: Auth0Config.domain,
	AUTH0_CALLBACK_URL: Auth0Config.callbackUrl || 'http://localhost:3000/callback'
}

module.exports.main = (req, res, next) => {
	res.render('pages/login', { title: AppConfig.title, env: loginEnv });
}

module.exports.verifyEmail = (req, res, next) => {
	req.session.destroy();
	let verifyEmailMessage = 'Please verify your email address before logging in.';
	res.render('pages/verify-email', { title: AppConfig.title, verifyEmailMessage: verifyEmailMessage });
}

module.exports.logout = (req, res, next) => {
	req.session.destroy();
	res.redirect(IdentityProviderUtilities.constructLogoutUrl());
}

module.exports.callback = asyncFunc(function* (req, res, next) {
	let boxAppUserId = IdentityProviderUtilities.checkForExistingBoxAppUserId(req.user);
	let boxStorageFolderId = IdentityProviderUtilities.checkForExistingBoxStorageFolderId(req.user);
	console.log(`App User Id: ${boxAppUserId}`);
	if (!boxAppUserId) {
		let appUser = yield Box.createAppUser(req.user.displayName);
		let updatedProfile = yield IdentityProvider.updateUserModel(req.user.id, appUser.id);
		req.user.app_metadata = updatedProfile.app_metadata;
		boxAppUserId = appUser.id;
	}

	if (!boxStorageFolderId) {
		console.log("Starting to create storage folder...");
		let appUserClient = yield Box.getUserClient(boxAppUserId);
		let serviceAccountClient = yield Box.getServiceAccountClient();

		console.log("Retrieving service account id");
		let serviceAccount = yield serviceAccountClient.users.getAsync('me', null);
		let serviceAccountId = serviceAccount.id;
		console.log(`Service account id: ${serviceAccountId}`);
		let appUserStorageFolderName = `${req.user.displayName} Template Storage ${req.user.id}`;
		console.log("Creating storage folder...");
		let storageFolder = yield appUserClient.folders.createAsync('0', appUserStorageFolderName);
		console.log(storageFolder);
		let collabForServiceAccount = yield appUserClient.collaborations.createAsync(
			{ type: "user", id: serviceAccountId }, storageFolder.id, "co-owner");
		console.log("Collaborated service account...");
		console.log(collabForServiceAccount);
		if (BoxOptions.boxManagedUserId && BoxOptions.boxManagedUserId != '') {
			let collabForManagedUser = yield appUserClient.collaborations.createAsync(
				{ type: "user", id: BoxOptions.boxManagedUserId }, storageFolder.id, "co-owner");
			console.log("Collaborated managed user account...");
			console.log(collabForManagedUser);
		}
		let updatedProfile = yield IdentityProvider.updateUserModelWithStorageFolderId(req.user.id, storageFolder.id);
		req.user.app_metadata = updatedProfile.app_metadata;
	}
	res.redirect('/form');
})