'use strict';
const csrf = require('csurf');
const Promise = require('bluebird');
const asyncFunc = Promise.coroutine;
const config = require('config');
const BoxOptions = config.get('BoxOptions');
const AppConfig = config.get('AppConfig');
let BoxService = require('../../box-service/boxClientService');
let IdentityProviderUtilities = require('../../identity-service/identityProviderUtilities');

let request = require('request'),
	fs = require('fs');

module.exports.main = asyncFunc(function* (req, res, next) {
	let boxAppUserId = req.user.app_metadata[BoxOptions.boxAppUserIdFieldName];
	if (!boxAppUserId) {
		res.redirect('/');
	}
	let rootFolder = req.params.id || '0';
	let appUserClient = yield BoxService.getUserClient(boxAppUserId);
	let accessToken = yield BoxService.generateUserToken(boxAppUserId);
	let storageFolderId = IdentityProviderUtilities.checkForExistingBoxStorageFolderId(req.user);
	console.log(`Found storage folder id: ${storageFolderId}`);

	let isLogoSet = ("isLogoSet" in req.session) ? req.session.isLogoSet : false;
    let logoFileUrl = '';
    if (isLogoSet) {
        logoFileUrl = `${AppConfig.domain}/download-logo`;
    }

	let isIndustrySet = ("industryTarget" in req.session) ? req.session.industryTarget : false;
    let isInsurance = false;
    if (isIndustrySet) {
        isInsurance = (req.session.industryTarget === AppConfig.industryTargets.INSURANCE) ? true : false;
    }

	let isContactFirstNameSet = ("contactFirstName" in req.session) ? req.session.contactFirstName : false;
    let contactFirstName = "";
    if (isContactFirstNameSet) {
        contactFirstName = req.session.contactFirstName;
    }

	req.user.accessToken = accessToken.accessToken;
	req.user.storageFolderId = storageFolderId;
	req.session.industryStep = 1;
	req.session.createdImages = [];

	res.render('pages/form', {
		user: req.user,
		title: AppConfig.title,
		domain: AppConfig.domain,
		csrfToken: req.csrfToken(),
		saveLogoImageUrl: `${AppConfig.domain}/images/save-logo`,
		retrieveLogoImageUrl: `${AppConfig.domain}/images/retrieve-logo`,
		submitTemplateValuesUrl: `${AppConfig.domain}/form/form-values`,
		createNewImageUrl: `${AppConfig.domain}/images/create-image`,
		resetLogoUrl: `${AppConfig.domain}/form/reset-logo`,
		industryTargets: AppConfig.industryTargets,
		isLogoSet: isLogoSet,
		logoFileUrl: logoFileUrl,
		isInsurance: isInsurance,
		contactFirstName: contactFirstName
	});
});

module.exports.persistFormValues = (req, res, next) => {
	req.session.contactFirstName = req.body.contactFirstName;
	req.session.industryTarget = req.body.industryTarget;
	console.log(req.session.industryTarget);
	res.sendStatus(200);
}

module.exports.resetLogo = (req, res, next) => {
	req.session.isLogoSet = false;
	delete req.session.logoFileUrl;
	res.redirect('/form');
}