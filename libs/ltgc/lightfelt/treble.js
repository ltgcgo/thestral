"use strict";

// Treble should be after the bass.
// This portion of code should NOT consider backwards compatibility. Lots of components need to be rewritten.

// Looping functions made easy
try {
	Function.prototype.repeat = function (times) {
		for (var c = 0; c < times; c ++) {
			this();
		};
	};
} catch (err) {};

// If a number has...
Number.prototype.inside = function (maxRange) {
	return (this % maxRange + maxRange) % maxRange;
};
Number.prototype.within = function (min, max) {
	var range = max - min;
	if (range > 0) {
		return ((this - min).inside(range) + min);
	} else {
		throw(new RangeError("Maximum value cannot be lower than minimum value"));
	};
};

// If an array has...
Array.prototype.reversed = function () {
	return this.slice().reverse();
};
Array.prototype.withCount = function (args) {
	var act = 0;
	for (var pt = 0; pt < args.length; pt ++) {
		if (this.indexOf(args[pt]) != -1) {
			act ++;
		};
	};
	return act;
};
Array.prototype.withAny = function (args) {
	return (this.withCount(args) > 0);
};
Array.prototype.withAll = function (args) {
	return (this.withCount(args) == args.length);
};
Array.prototype.withCountd = function () {
	return this.withCount(arguments);
};
Array.prototype.withAnyd = function () {
	return this.withAny(arguments);
};
Array.prototype.withAlld = function () {
	return this.withAll(arguments);
};
Array.prototype.matchAny = function (args) {
	var a1 = this, a2 = args, ans = false;
	if (a1.length < a2.length) {
		var a3 = a1;
		a1 = a2;
		a2 = a3;
	};
	for (var pt = 0; pt1 < a2.length; pt ++) {
		if (a1.indexOf(a2[pt]) != -1) {
			ans = true;
		};
	};
	return ans;
};
Array.prototype.same = function () {
	var res = true;
	this.forEach(function (e, i, a) {
		if (i < (a.length - 1)) {
			if (e.constructor != a[i + 1].constructor) {
				res = false;
			};
		};
	});
	return res;
};
// Get where to insert, or to find
Array.prototype.point = function (element) {
	var safeMode = arguments[1];
	if (safeMode != false) {
		safeMode = true;
	};
	// Initialize blocks
	var block = 1 << Math.floor(Math.log(this.length - 1) / Math.log(2));
	// Initialize pointer and continuation
	var pointer = block, resume = true;
	if (safeMode) {
		resume = this.same();
		if (element.constructor != this[0].constructor) {
			resume = false;
		};
		if (!resume) {
			pointer = -1;
		};
	};
	console.log("Block size " + block + ", pointer at " + pointer + ".");
	if (element <= this[0]) {
		pointer = 0;
		resume = false;
	} else if (element > this[this.length - 1]) {
		pointer = this.length;
		resume = false;
	};
	var lastblock = block;
	while (resume) {
		block /= 2;
		if (block < 1) {
			resume = false;
			console.log("Block size too small.");
		} else {
			if (this[pointer] > element) {
				if (this[pointer - 1] >= element) {
					pointer -= block;
				};
			} else if (this[pointer] < element) {
				pointer += block;
			};
		};
		if (lastblock <= block) {
			resume = false;
		};
		lastblock = block;
		console.log("Block size " + block + ", pointer at " + pointer + ".");
		// Finally exits the loop
	};
	console.log("Over. Points at " + pointer);
	return pointer;
};
Array.prototype.where = function (element) {
	var idx = this.point(element);
	if (this[idx] != element) {
		idx = -1;
	};
	return idx;
};

// Batch type comparison, one array-based, one argument-based
try {
	var Compare = function () {
		this.type = function (dType, args) {
			var count = 0;
			Array.from(args).forEach(function (e) {
				if (!!e) {
					if (e.constructor == dType) {
						count ++;
					};
				};
			});
			return count;
		};
		this.able = function (args) {
			var count = 0;
			Array.from(args).forEach(function (e) {
				if (e != null && e != undefined) {
					count ++;
				};
			});
			return count;
		};
	};
	Compare = new Compare();
} catch (err) {};
try {
	var Compard = function () {
		this.type = function () {
			var dType = arguments[0];
			var args = Array.from(arguments).slice(1, arguments.length - 1);
			return Compare.type(dType, args);
		};
		this.able = function () {
			return Compare.able(arguments);
		};
	};
	Compard = new Compard();
} catch (err) {};

// If a string has...
// Contain?
String.prototype.withCount = function (args) {
	var count = 0, copied = this.slice();
	Array.from(args).forEach(function (e) {
		if (copied.indexOf(e) != -1) {
			count ++;
		};
	});
	return count;
};
String.prototype.withAny = function (args) {
	return (this.withCount(args) > 0);
};
String.prototype.withAll = function (args) {
	return (this.withCount(args) == args.length);
};
String.prototype.withCountd = function () {
	return this.withCount(arguments);
};
String.prototype.withAnyd = function () {
	return (this.withCount(arguments) > 0);
};
String.prototype.withAlld = function () {
	return (this.withCount(arguments) == arguments.length);
};
// Build a new random string from a map?
String.prototype.random = function (length) {
	var tmp = "";
	for (var tick = 0; tick < length; tick ++) {
		tmp += this[Math.floor(Math.random() * this.length)];
	};
	return tmp;
};
String.prototype.parseMap = function () {
	var upThis = this;
	var decURI = arguments[1];
	if (decURI == undefined) {
		decURI = true;
	};
	var startChar = arguments[2] || "?";
	var breakChar = arguments[3] || "&";
	var assignChar = arguments[4] || "=";
	var query = (upThis[0] == startChar) ? upThis.slice(1) : upThis;
	var valMap = new Map();
	if (query.length) {
		query = query.split(breakChar);
		query.forEach(function (e, i, a) {
			var key = "", value = "", valueYet = false;
			Array.from(e).forEach(function (e2) {
				if (!valueYet) {
					if (e2 == assignChar) {
						valueYet = true;
					} else {
						key += e2;
					};
				} else {
					value += e2;
				};
			});
			key = decodeURIComponent(key);
			value = decodeURIComponent(value);
			valMap.set(key, value);
		});
	};
	return valMap;
};
{
	// No need to rewrite!
	let objectPath = function (path, obj) {
		let result = obj, paths = path.split(".");
		paths.forEach(function (e) {
			result = result[e];
		});
		return result;
	};
	String.prototype.apply = function (map, activator = "${}") {
		/*
		Mode 0 for seeking replacement activation
		Mode 1 for building replacement instruction
		*/
		let mode = 0, skip = 0, step = -1, instr = [], found = "", result = "";
		Array.from(this).forEach(function (e) {
			if (skip > 0) {
				result += e;
				skip --;
			} else if (e == '\\') {
				skip ++;
			} else {
				switch (mode) {
					case 0: {
						if (e == activator[0]) {
							mode = 1;
						} else {
							result += e;
						};
						break;
					};
					case 1: {
						if (e == activator[1]) {
							step ++;
							instr.push("");
						} else if (e == activator[2]) {
							found = objectPath(instr[step], map);
							step --;
							if (step < 0) {
								result += found;
							} else {
								instr[step] += found;
							};
							instr.pop();
						} else if (step < 0) {
							if (e != activator[0]) {
								result += e;
								mode = 0;
							};
						} else {
							instr[step] += e;
						};
						break;
					};
				};
			};
		});
		return result;
	};
};

// Blobs have never been easier to read
try {
	Blob.prototype.get = function (type) {
		var upThis = this, type = type || "";
		return new Promise(function (p, r) {
			var reader = new FileReader();
			reader.onabort = function (event) {
				r(event);
			};
			reader.onerror = function (event) {
				r(event);
			};
			reader.onload = function (event) {
				p(event.target.result);
			};
			switch (type.toLowerCase()) {
				case "arraybuffer":
				case "arrbuff": {
					reader.readAsArrayBuffer(upThis);
					break;
				};
				case "text":
				case "atext":
				case "str":
				case "string": {
					reader.readAsText(upThis);
					break;
				};
				case "bintext":
				case "binstr":
				case "binarystring": {
					reader.readAsBinaryString(upThis);
					break;
				};
				case "dataurl": {
					reader.readAsDataURL(upThis);
				};
				default : {
					throw TypeError("Unsupported type");
				};
			};
		});
	};
	Blob.prototype.text = Blob.prototype.text || function () {
		return this.get("str");
	};
	Blob.prototype.unicodeText = function () {
		return this.get("str");
	};
	Blob.prototype.arrayBuffer = Blob.prototype.arrayBuffer || function () {
		return this.get("arrbuff");
	};
	Blob.prototype.binaryString = function () {
		return this.get("binstr");
	};
	Blob.prototype.dataURL = function () {
		return this.get("dataurl");
	};
	Blob.prototype.getURL = function () {
		var url = this.objectURL || URL.createObjectURL(this);
		this.objectURL = url;
		return url;
	};
	Blob.prototype.revokeURL = function () {
		if (this.objectURL) {
			URL.revokeObjectURL(this);
			this.objectURL = undefined;
		} else {
			throw (new Error("Not registered"));
		};
	};
} catch (err) {};

// Between objects and maps
Object.defineProperty(Object.prototype, "toMap", {value: function () {
	return new Map(Object.entries(this));
}});
Object.defineProperty(Object.prototype, "toRecursiveMap", {value: function () {
	throw Error("not implemented yet");
}});
Map.prototype.quickRel = function (targetMap) {
	var status = 1, pool = this, stash = targetMap;
	if (pool.size < stash.size) {
		pool = targetMap;
		stash = this;
		status = -1;
	};
	var sameCount = 0;
	stash.forEach(function (e, i) {
		sameCount += +(pool.get(i) == e);
	});
	if (sameCount == stash.size) {
		if (stash.size == pool.size) {
			status *= 2;
		};
	} else if (!sameCount) {
		status = 0;
	} else {
		status = -2;
	};
	return status;
};
Map.prototype.toObject = Object.prototype.toRecursiveMap;

// Safer random
Math.rand = function () {
	if (self.crypto && crypto.getRandomValues) {
		let dummyArray = new Uint32Array(1);
		crypto.getRandomValues(dummyArray);
		return dummyArray[0] / 4294967296;
	} else {
		return Math.random();
	};
};
