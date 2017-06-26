'use strict';
const csrf = require('csurf');
const Promise = require('bluebird');
const asyncFunc = Promise.coroutine;
const config = require('config');
const BoxOptions = config.get('BoxOptions');
const AppConfig = config.get('AppConfig');
const request = require('request');
const fs = require('fs');
const fileType = require('file-type');
const validUrl = require('valid-url');

let BoxService = require('../../box-service/boxClientService');
let IdentityProviderUtilities = require('../../identity-service/identityProviderUtilities');

module.exports.createImage = asyncFunc(function* (req, res, next) {
    let boxAppUserId = req.user.app_metadata[BoxOptions.boxAppUserIdFieldName];
    if (!boxAppUserId) {
        res.redirect('/');
    }
    let rootFolder = req.params.id || '0';
    let appUserClient = yield BoxService.getUserClient(boxAppUserId);
    let accessToken = yield BoxService.generateUserToken(boxAppUserId);
    let storageFolderId = IdentityProviderUtilities.checkForExistingBoxStorageFolderId(req.user);
    console.log(`Found storage folder id: ${storageFolderId}`);

    req.user.accessToken = accessToken.accessToken;
    req.user.storageFolderId = storageFolderId;
    let isLogoSet = ("isLogoSet" in req.session) ? req.session.isLogoSet : false;
    let logoFileUrl = '';
    if (isLogoSet) {
        logoFileUrl = `${AppConfig.domain}/download-logo`;
    }

    let isIndustrySet = ("industryTarget" in req.session) ? req.session.industryTarget : false;
    let targetIndustry = '';
    if (isIndustrySet) {
        targetIndustry = req.session.industryTarget;
    }

    console.log(req.session.industryTarget);

    let isIndustryStepSet = ("industryStep" in req.session) ? req.session.industryStep : false;
    let industryStep = '';
    if (isIndustryStepSet) {
        industryStep = req.session.industryStep;
    } else {
        req.session.industryStep = 1;
        industryStep = 1;
    }

    let isFinalStep = false;
    if (industryStep == 3) {
        isFinalStep = true;
    }

    
    res.render('pages/create-new-image', {
        user: req.user,
        title: AppConfig.title,
        domain: AppConfig.domain,
        csrfToken: req.csrfToken(),
        backgroundImagePath: `${AppConfig.domain}/assets/${targetIndustry}${industryStep}.png`,
        logoFileUrl: logoFileUrl,
        isLogoSet: isLogoSet,
        industry: targetIndustry,
        currentStep: industryStep,
        saveImageUrl: `${AppConfig.domain}/images/save-image`,
        createNewImageUrl: `${AppConfig.domain}/images/create-image`,
        templateUrl: `${AppConfig.domain}/template`,
        startOverUrl: `${AppConfig.domain}/images/start-over`,
        isFinalStep: isFinalStep
    });
});

module.exports.retrieveLogoImage = asyncFunc(function* (req, res, next) {
    if (!(req && req.body && req.body.imageUrl && validUrl.isUri(req.body.imageUrl))) {
        res.sendStatus(400);
        return;
    }
    let boxAppUserId = req.user.app_metadata[BoxOptions.boxAppUserIdFieldName];
    if (!boxAppUserId) {
        res.redirect('/');
        return;
    }
    let appUserClient = yield BoxService.getUserClient(boxAppUserId);
    let storageFolderId = IdentityProviderUtilities.checkForExistingBoxStorageFolderId(req.user);
    let imageStream = request.get(req.body.imageUrl, { encoding: null });
    let fileName = `${req.user.id}-${Date.now().toString()}-logo.png`
    let type = fileType(imageStream);
    console.log("File type");
    console.log(type);
    console.log("Pulled down file...");
    console.log(imageStream);
    try {
        let newFile = yield appUserClient.files.uploadFileAsync(storageFolderId, fileName, imageStream);
        console.log("Uploaded file...");
        let newFileId = newFile.entries[0].id;
        console.log("Creating shared link...");
        let sharedLink = yield appUserClient.files.updateAsync(newFileId, {
            shared_link: appUserClient.accessLevels.OPEN
        });
        console.log("Shared link created...");
        req.session.logoFileUrl = sharedLink.shared_link.download_url;
        req.session.isLogoSet = true;
        res.sendStatus(201);
    } catch (e) {
        console.log(e);
    }
});

module.exports.persistCreatedImage = (req, res, next) => {
    console.log(req.body.url);
    req.session.createdImages = req.session.createdImages || [];
    req.session.createdImages.push(req.body.url);
    req.session.industryStep++;
    console.log(req.session.industryStep);
    res.sendStatus(200);
}

module.exports.persistLogoImageUrl = (req, res, next) => {
    console.log(req.body.url);
    req.session.logoFileUrl = req.body.url;
    req.session.isLogoSet = true;
    res.sendStatus(200);
}

module.exports.startOver = (req, res, next) => {
    console.log(req.body.url);
    delete req.session.industryStep;
	delete req.session.createdImages;
    res.redirect('/form');
}

function checkImageType(req) {

}