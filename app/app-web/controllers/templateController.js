'use strict';
const csrf = require('csurf');
const Promise = require('bluebird');
const asyncFunc = Promise.coroutine;
const config = require('config');
const BoxOptions = config.get('BoxOptions');
const AppConfig = config.get('AppConfig');

let BoxService = require('../../box-service/boxClientService');
let IdentityProviderUtilities = require('../../identity-service/identityProviderUtilities');

module.exports.main = (req, res, next) => {
    let isInsurance = false;
    let isFinServ = false;

    let isIndustrySet = ("industryTarget" in req.session) ? req.session.industryTarget : false;
    let targetIndustry = '';
    if (isIndustrySet) {
        targetIndustry = req.session.industryTarget;
    }

    if(targetIndustry === AppConfig.industryTargets.FIN_SERV) {
        isFinServ = true;   
    } else if (targetIndustry === AppConfig.industryTargets.INSURANCE) {
        isInsurance = true;
    }
    res.render('pages/template', {
        title: AppConfig.title,
        user: req.user,
        createdImages: req.session.createdImages,
        contactFirstName: req.session.contactFirstName,
        isInsurance: isInsurance,
        isFinServ: isFinServ,
        startOverUrl: `${AppConfig.domain}/images/start-over`
    });
}