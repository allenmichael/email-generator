'use strict';

let express = require('express');
let router = express.Router();
let passport = require('passport');
let IdentityProviderUtilities = require('../../identity-service/identityProviderUtilities');

let ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
let emailVerified = (req, res, next) => {
    console.log("Checking email...");
    console.log(req.user);
    let emailVerified = IdentityProviderUtilities.checkForVerifiedEmail(req.user);
    console.log(emailVerified);
    if (req.user && !emailVerified) {
        console.log("Not verified...");
        res.redirect('/verify-email');
    } else {
        next();
    }
}

let callbackErrorCheck = (req, res, next) => {
	console.log(req.query);
	if (req.query.error) {
		console.log("Found error...");
		res.render('pages/error', {
			title: "Error...",
			message: req.query.error_description,
			error: {}
		});
		return;
	} else { 
		next();
	}
}

const csrf = require('csurf');
let csrfProtection = csrf({ cookie: true });

let indexCtrl = require('../controllers/indexController');
let loginCtrl = require('../controllers/loginController');
let formCtrl = require('../controllers/formController');
let imagesCtrl = require('../controllers/imagesController');
let templateCtrl = require('../controllers/templateController');

router.get('/', indexCtrl.main);
router.get('/verify-email', loginCtrl.verifyEmail);
router.get('/login', emailVerified, loginCtrl.main);
router.get('/callback', callbackErrorCheck, passport.authenticate('auth0', { failureRedirect: '/' }), emailVerified, loginCtrl.callback);
router.get('/logout', ensureLoggedIn, emailVerified, loginCtrl.logout);
router.get('/download-logo', ensureLoggedIn, indexCtrl.downloadLogo);
router.get('/form', ensureLoggedIn, emailVerified, csrfProtection, formCtrl.main);
router.get('/form/reset-logo', ensureLoggedIn, emailVerified, csrfProtection, formCtrl.resetLogo);
router.get('/images/create-image', ensureLoggedIn, emailVerified, csrfProtection, imagesCtrl.createImage);
router.get('/images/start-over', ensureLoggedIn, emailVerified, csrfProtection, imagesCtrl.startOver);
router.get('/template', ensureLoggedIn, csrfProtection, emailVerified, templateCtrl.main);

router.post('/form/form-values', ensureLoggedIn, emailVerified, csrfProtection, formCtrl.persistFormValues);
router.post('/images/save-image', ensureLoggedIn, emailVerified, csrfProtection, imagesCtrl.persistCreatedImage);
router.post('/images/retrieve-logo', ensureLoggedIn, emailVerified, csrfProtection, imagesCtrl.retrieveLogoImage);
router.post('/images/save-logo', ensureLoggedIn, emailVerified, csrfProtection, imagesCtrl.persistLogoImageUrl);

module.exports = router;