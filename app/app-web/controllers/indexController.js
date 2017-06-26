'use strict';
const Promise = require('bluebird');
const asyncFunc = Promise.coroutine;
let BoxService = require('../../box-service/boxClientService');
const request = require('request');
const config = require('config');
const Auth0Config = config.get('Auth0Config');
const BoxOptions = config.get('BoxOptions');

module.exports.main = (req, res, next) => {
	if (req.user) {
		let boxAppUserId = req.user.app_metadata[BoxOptions.boxAppUserIdFieldName];
		if (!boxAppUserId) {
			res.redirect('/login');
			return;
		}
		res.redirect('/form');
		return;
	}
	res.redirect('/login');
}

module.exports.downloadLogo = (req, res, next) => {
	let isLogoSet = ("isLogoSet" in req.session) ? req.session.isLogoSet : false;
	let logoFileUrl = '';
	if (isLogoSet) {
		logoFileUrl = req.session.logoFileUrl;
	}
	request(logoFileUrl, { encoding: 'binary' }).pipe(res);
}