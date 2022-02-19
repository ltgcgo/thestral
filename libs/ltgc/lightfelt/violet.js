"use strict";

// It's all about the bass, but for DOM.

// Quick actions
self["$e"] = self["$e"] || function (selector, source) {
	var src = source || document;
	return src.querySelector(selector);
};
self["$a"] = self["$a"] || function (selector, source) {
	var src = source || document;
	return Array.from(src.querySelectorAll(selector));
};
if (self.HTMLElement) {
	HTMLElement.prototype.$e = function (selector) {
		return $e(selector, this);
	};
	HTMLElement.prototype.$a = function (selector) {
		return $a(selector, this);
	};
};

// The ultimate states
try {
	self.DOMTokenList.prototype.on = function (id) {
		if (!this.contains(id)) {
			this.add(id);
		};
	};
	self.DOMTokenList.prototype.off = function (id) {
		if (this.contains(id)) {
			this.remove(id);
		};
	};
} catch (err) {};

// Stylesheet loading
self.styleAsynd = self.styleAsynd || function (listOfScripts) {
	var srcs = Array.from(arguments), promiseObj;
	var actionCheck = function (proceed, failSrc) {
		proceed();
	};
	if (Compare.type(String, srcs) == srcs.length) {
		promiseObj = new Promise ((p) => {
			srcs.forEach(function (e) {
				var k = document.createElement("link");
				k.rel = "stylesheet";
				k.href = e;
				document.head.appendChild(k);
			});
		});
	} else {
		throw(new TypeError("only type String is allowed"));
	};
	return promiseObj;
};

// Try async plain script loading
self.importAsynd = self.importAsynd || function (listOfScripts) {
	var srcs = Array.from(arguments), doneCount = 0, undoneList = [], successCount = 0, promiseObj;
	var actionCheck = function (proceed, failSrc) {
		if (failSrc) {
			undoneList.push(failSrc);
		} else {
			successCount ++;
		};
		doneCount ++;
		if (doneCount == srcs.length) {
			proceed({"allSuccess": successCount == doneCount, "failed": undoneList});
		};
	};
	if (Compare.type(String, srcs) == srcs.length) {
		promiseObj = new Promise ((p) => {
			srcs.forEach(function (e) {
				var k = document.createElement("script");
				k.src = e;
				k.onload = function () {
					actionCheck(p);
				};
				k.onerror = function () {
					actionCheck(p, this.src);
				};
				document.head.appendChild(k);
			});
		});
	} else {
		throw(new TypeError("only type String is allowed"));
	};
	return promiseObj;
};
importAsynd.imported = new Set();
