'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
	BoxSDKConfig: {
		boxClientId: "",
		boxClientSecret: "",
		boxEnterpriseId: "",
		boxPrivateKeyFileName: "private_key.pem",
		boxPrivateKeyPassword: "",
		boxPrivateKey: (boxPrivateKeyFileName) => {
			return fs.readFileSync(path.resolve(boxPrivateKeyFileName));
		},
		boxPublicKeyId: "",
	},
	BoxOptions: {
		boxManagedUserId: "",
		inMemoryStoreSize: "100",
		expiresAtFieldName: "expiresAt",
		boxAppUserIdFieldName: "box_appuser_id",
		boxStorageFolderFieldName: "box_storage_folder"
	},

	Auth0Config: {
		domain: "",
		clientId: "",
		clientSecret: "",
		callbackUrl: "http://localhost:3000/callback",
		logoutUrl: "",
		logoutReturnUrl: "http://localhost:3000",
		sessionSecret: "securepassword",
		inMemoryStoreSize: "100",
		managementAPIClientId: "",
		managementAPIClientSecret: ""
	},

	RedisConfig: {
		port: "",
		address: "",
		password: ""
	},

	AppConfig: {
		domain: "http://localhost:3000",
		industryTargets: {
			FIN_SERV: "finServ", 
			INSURANCE: "insurance"
		},
		title: "Lead Generation Email Generator"
	}
}