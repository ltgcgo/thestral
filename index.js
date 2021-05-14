"use strict";

var conf;

const svrPort = Deno.args[0] || 20810;
const svrHost = Deno.args[1] || "localhost";
var compiledlBlock = ["/config.json", "/access/*"];
console.log("Loading dependencies...")
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
//import {serve} from "https://deno.land/std@0.95.0/http/server.ts";
console.log("Loading configuration...");
// Load file
try {
	var tmpConf = await Deno.readTextFile("./config.json");
	//console.log(tmpConf);
	conf = JSON.parse(tmpConf);
} catch (err) {
	console.log(err.stack);
	console.log("File loading error. Using blank config instead...");
	conf = {};
};
console.log(JSON.stringify(conf));
// Load map
CryptoJS.enc.Base64._map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_ ";
if (conf.verify?.map?.length > 63) {
	var realMap = conf.verify.map.slice(0, 65);
	CryptoJS.enc.Base64._map = realMap;
	console.log("Custom map loaded: [" + realMap + "]");
};
// Load hashing configuration
var useHashAlgo = "SHA1", useHashLength = 20, useHashOptions = {};
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
		console.error("Unknown or unsafe hashing algorithm: " + useHashAlgoTmp);
	};
};
console.log("Used hashing algorithm: " + useHashAlgo);
// Load allowed types
var useTypes = [];
if (conf.types) {
	useTypes = conf.types;
};
console.log("Allowed types: " + useTypes.toString());
console.log("Starting SnowPlum...")
const server = Deno.listen({port: svrPort, hostname: svrHost});
console.log("An HTTP server is up at [http://${host}:${port}/]".alter({host: svrHost, port: svrPort}));
for await (const incoming of server) {
	(async function () {
		const connection = Deno.serveHttp(incoming);
		for await (const requestEvent of connection) {
			var request = requestEvent.request;
			var uri = new URL(request.url);
			var path = uri.pathname;
			//console.log("${time} - ${method} ${host} ${path}".alter({time: Date.now(), method: request.method, path: path, host: uri.host}))
			var search = uri.search.parseMap();
			var body = "", status = 403;
			if (request.method == "GET") {
				if (search.has(conf.params?.token || "token")) {
					var idUser = search.get(conf.params?.user || "user") || "";
					var idType = search.get(conf.params?.type || "type") || "";
					var idSecret = conf.verify?.secret || "";
					var idToken = search.get(conf.params?.token || "token");
					var seedOTxt = "${type},${user},${secret}".alter({user: idUser, type: idType, secret: idSecret});
					var seedTxt = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(CryptoJS[useHashAlgo](seedOTxt, useHashOptions).toString())).trimEnd().slice(0, useHashLength);
					if (idToken == seedTxt) {
						if (useTypes.indexOf(idType) != -1) {
							var reqAllowed = true;
							compiledlBlock.forEach(function (e) {
								if (e[0] == "*") {
									if (e[e.length - 1] == "*") {
										if (path.indexOf(e.slice(1, e.length - 2)) != -1) {
											reqAllowed = false;
										};
									} else {
										if (path.lastIndexOf(e.slice(1)) == (path.length - e.length + 1)) {
											reqAllowed = false;
										};
									};
								} else {
									if (e[e.length - 1] == "*") {
										if (path.indexOf(e.slice(0, e.length - 1)) == 0) {
											reqAllowed = false;
										};
									} else {
										if (path == e) {
											reqAllowed = false;
										};
									};
								};
							});
							if (reqAllowed) {
								try {
									body = await Deno.readTextFile("./" + idType + path);
									status = 200;
								} catch (err) {
									body = "400 Internal Error"
									status = 400;
									console.log("Requested " + request.method + ": ." + path);
									console.error((new Date()).toJSON() + " - " + err.stack);
								};
								console.log("[${sub}] authentication success.".alter({sub: idUser}));
							} else {
								body = '{"message": "File access is not allowed."}';
								console.error("Blocklist matched.");
							};
						} else {
							body = '{"message": "Type is not allowed."}';
							console.log("Type [${type}] authentication failure.".alter({type: idType}));
						};
					} else {
						body = '{"message": "Wrong token."}'
						console.log("[${sub}] authentication failure. Expected token: [${seedToken}], received token: [${rcvToken}].".alter({sub: idUser, seedToken: seedTxt, rcvToken: idToken}));
					};
				} else {
					console.log("Malformed URL: " + request.url);
					body = '{"message": "No existing token."}';
				};
				requestEvent.respondWith(new Response(body), {status: status});
			};
		};
	})();
};
