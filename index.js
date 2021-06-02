"use strict";

const svrPort = parseInt(Deno.args[0] || "20810");
const svrHost = Deno.args[1] || "localhost";
const hardcodedBlocks = ["/config.json", "/access/*"];

// Prepare xConsole
var xConsole = {};
xConsole.log = function (text) {
	console.log(`[INFL - ${(new Date()).toJSON()}] ${text}`);
};
xConsole.error = function (text) {
	console.error(`[ERROR - ${(new Date()).toJSON()}] ${text}`);
};
xConsole.warn = function (text) {
	console.warn(`[WARN - ${(new Date()).toJSON()}] ${text}`);
};

xConsole.log("Loading dependencies...")
// WEBSF
import {} from "./libs/webcirque/websf/alter.js";
import {} from "./libs/webcirque/websf/flyover.js";
// CryptoJS
import {} from "./libs/cryptojs/cryptojs-min/crypto-js.js";
import {} from "./libs/cryptojs/cryptojs-min/core.js";
import {} from "./libs/cryptojs/cryptojs-min/cipher-core.js";
import {} from "./libs/cryptojs/cryptojs-min/x64-core.js";
import {} from "./libs/cryptojs/cryptojs-min/enc-base64.js";
import {} from "./libs/cryptojs/cryptojs-min/enc-hex.js";
import {} from "./libs/cryptojs/cryptojs-min/enc-latin1.js";
import {} from "./libs/cryptojs/cryptojs-min/enc-utf8.js";
import {} from "./libs/cryptojs/cryptojs-min/enc-utf16.js";
import {} from "./libs/cryptojs/cryptojs-min/sha1.js";
import {} from "./libs/cryptojs/cryptojs-min/ripemd160.js";
import {} from "./libs/cryptojs/cryptojs-min/sha256.js";
import {} from "./libs/cryptojs/cryptojs-min/sha512.js";
import {} from "./libs/cryptojs/cryptojs-min/sha3.js";
xConsole.log("Preparing configuration...");
// Config global vars
var conf = {};
var useHashAlgo, useHashLength, useHashOptions, useTypes, compiledGlobalBlock;
var adminToken;
var reloadConfig = async function () {
	xConsole.log("Loading configuration...");
	// Load file
	try {
		let tmpConf = await Deno.readTextFile("./config.json");
		conf = JSON.parse(tmpConf);
	} catch (err) {
		xConsole.error(err.stack);
		xConsole.error(new Error("File loading error. Configuration unchanged..."));
	};
	// xConsole.log(JSON.stringify(conf));
	// Load map
	CryptoJS.enc.Base64._map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_ ";
	if (conf.verify?.map?.length > 63) {
		var realMap = conf.verify.map.slice(0, 65);
		CryptoJS.enc.Base64._map = realMap;
		xConsole.log("Custom map loaded: [" + realMap + "]");
	};
	// Load hashing configuration
	useHashAlgo = "SHA1", useHashLength = 20, useHashOptions = {};
	if (conf.verify?.hash?.type) {
		var useHashAlgoTmp = conf.verify.hash.type.toUpperCase();
		if (useHashAlgoTmp.withAnyd("SHA1", "SHA256", "SHA512", "SHA3", "RIPEMD160")) {
			useHashAlgo = useHashAlgoTmp;
			if (conf.verify.hash.length) {
				useHashLength = conf.verify.hash.length;
			};
			if (conf.verify.hash.options) {
				useHashOptions = conf.verify.hash.options;
			};
		} else {
			xConsole.error(new Error("Unknown or unsafe hashing algorithm: " + useHashAlgoTmp));
		};
	};
	xConsole.log("Used hashing algorithm: " + useHashAlgo);
	// Load allowed types
	useTypes = [];
	if (conf.types) {
		useTypes = conf.types;
	};
	xConsole.log("Allowed types: " + useTypes.toString());
	// Load admin token
	xConsole.log("Importing admin tokens...");
	adminToken = [];
	conf.verify?.admin?.forEach(function (e) {
		if (e.length == useHashLength) {
			adminToken.push(e);
			xConsole.log(`Admin token [${e.slice(0, 4)}] applied.`);
		} else {
			xConsole.warn(`Admin token [${e}] is invalid.`);
		};
	});
	if (adminToken.length < 1) {
		xConsole.log("No admin token available.");
	};
	// Load blocklists
	xConsole.log("Importing global blocklist...");
	compiledGlobalBlock = new Set(hardcodedBlocks);
	xConsole.log("Configuration loaded.");
};
await reloadConfig();
xConsole.log("Starting SnowPlum...")
const server = Deno.listen({port: svrPort, hostname: svrHost});
xConsole.log("An HTTP server is up at [http://${host}:${port}/]".alter({host: svrHost, port: svrPort}));
// List match
var matchList = function (path, list) {
	let reqBlocked = "";
	list.forEach(function (e) {
		if (e[0] == "*") {
			if (e[e.length - 1] == "*") {
				if (path.indexOf(e.slice(1, e.length - 2)) != -1) {
					reqBlocked = e;
				};
			} else {
				if (path.lastIndexOf(e.slice(1)) == (path.length - e.length + 1)) {
					reqBlocked = e;
				};
			};
		} else {
			if (e[e.length - 1] == "*") {
				if (path.indexOf(e.slice(0, e.length - 1)) == 0) {
					reqBlocked = e;
				};
			} else {
				if (path == e) {
					reqBlocked = e;
				};
			};
		};
	});
	return reqBlocked;
};
// Allowed and predefined params
var allowedMethods = ["GET"],
mapToken = conf.params?.token || "token",
mapType = conf.params?.type || "type",
mapUser = conf.params?.user || "user",
mapSecret = conf.verify?.secret || "";
for await (const incoming of server) {
	(async function () {
		const connection = Deno.serveHttp(incoming);
		for await (const requestEvent of connection) {
			// Public reused things
			let request = requestEvent.request;
			let uri = new URL(request.url);
			let path = uri.pathname;
			let search = uri.search.parseMap();
			// Default reply message
			let body = "403 Forbidden", status = 403;
			try {
				if (!request.method.withAny(allowedMethods)) {
					throw(new TypeError("Invalid method."));
				};
				if (!search.has(mapType)) {
					throw(new Error(`No existing type. Expected type in param: ${mapType}`));
				};
				if (!search.has(mapUser)) {
					throw(new Error(`No existing user. Expected user in param: ${mapUser}`));
				};
				if (!search.has(mapToken)) {
					throw(new Error(`No existing token. Expected token in param: ${mapToken}`));
				};
				var idUser = search.get(mapUser);
				var idType = search.get(mapType);
				var idToken = search.get(mapToken);
				var seedOTxt = `${idType},${idUser},${mapSecret}`;
				var seedTxt = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(CryptoJS[useHashAlgo](seedOTxt, useHashOptions).toString())).trimEnd().slice(0, useHashLength);
				if (seedTxt != idToken) {
					xConsole.error(`Original: [${seedOTxt}],Expected token: ${seedTxt}`);
					throw(new Error("Used invalid token."));
				};
				let reqBlocked = matchList(path, [...Array.from(compiledGlobalBlock)]);
				if (reqBlocked.length > 0) {
					throw(new Error(`Blocked with rule: \"${reqBlocked}\"`));
				};
				// Final reply
				try {
					if (matchList(path, ["/admin/*"])) {
						if (!idToken.withAny(adminToken)) {
							throw(new Error("Operation not permitted."));
						};
						body = "Requested admin mode, but with no valid actions.";
						status = 200;
						switch (path.slice(6)) {
							case "/reloadConf": {
								xConsole.log("Requested config reload via Web.");
								await reloadConfig();
								body = `Configuration reloaded on ${(new Date()).toJSON()}.`;
								break;
							};
							case "/showConf": {
								xConsole.log("Requested config display via Web.");
								body = JSON.stringify(conf);
								break;
							};
						};
					} else {
						body = await Deno.readTextFile("./" + idType + path);
						status = 200;
					};
				} catch (err) {
					body = "400 Internal Error";
					status = 400;
					xConsole.error(new Error(`Requested ${request.method} with internal error: .${path}\n${err.stack}`));
				};
			} catch (repError) {
				body = `{\"error\":\"${repError}\"}`;
				xConsole.error(repError.stack);
			};
			requestEvent.respondWith(new Response(body), {status: status});
		};
	})();
};
