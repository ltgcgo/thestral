"use strict";

// It's all about the bass. Forked from WEBSF.
// Should be in the same closure with others.
// This portion of code SHOULD consider backwards compatibility.

// Ahead
var lAltered = [];
if (!Array.prototype.indexOf) {
	lAltered.push("noIndexOf");
};
if (!String.prototype.includes || !Array.prototype.includes) {
	lAltered.push("noIncludes");
};

// Array functions backports
// Array.from must be rewritten!
Array.from = Array.from || function (target) {
	var ans = [];
	if (target.length >= 0) {
		for (var pt = 0; pt < target.length; pt ++) {
			ans.push(target[pt]);
		};
	} else {
		throw Error("Illegal length");
	};
	return ans;
};
Array.prototype.filter = Array.prototype.filter || function (func) {
	var ans = [];
	if (func) {
		if (func.constructor == Function) {
			for (var pt = 0; pt < this.length; pt ++) {
				if (func(this[pt])) {
					ans.push(this[pt]);
				};
			};
		};
	};
	return ans;
};
Array.prototype.forEach = Array.prototype.forEach || function (defFunc) {
	for (var ptc = 0; ptc < this.length; ptc ++) {
		defFunc(this[ptc], ptc, this);
	};
};
Array.prototype.indexOf = Array.prototype.indexOf || function (del) {
	var ans = -1;
	if (del) {
		for (var pt = 0; pt < this.length; pt ++) {
			if (this[pt] == del) {
				ans = pt;
				break;
			};
		};
	};
	return ans;
};
Array.prototype.lastIndexOf = Array.prototype.lastIndexOf || function (del) {
	var ans = -1;
	if (del) {
		for (var pt = 0; pt < this.length; pt ++) {
			if (this[pt] == del) {
				ans = pt;
				break;
			};
		};
	};
	return ans;
};
Array.prototype.includes = function (value) {
	return (this.indexOf(value) != -1);
};

// String functions backports
String.prototype.includes = function (string) {
	return (this.indexOf(string) != -1);
};
