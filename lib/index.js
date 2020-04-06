/* --------------------
 * babel-unique-id module
 * ------------------*/

'use strict';

// Modules
const {relative: pathRelative, sep: pathSeparator} = require('path'),
	createSymbols = require('symbols-collection'),
	invariant = require('tiny-invariant').default,
	{isString} = require('is-it-type');

// Imports
const {findPackageRoot, readPackageJson} = require('./package.js'),
	{shortHash, sha256Hash} = require('./hash.js');

// Constants
const DEFAULT_ID_LEN = 8;
const {ID_STRING, ID_COUNTER} = createSymbols('babel-unique-id', ['ID_STRING', 'ID_COUNTER']);

// Exports

/**
 * Create unique ID.
 *
 * ID is made up from:
 *   1. name and version of package file is in (if `isPackage` option set)
 *   2. path of file relative to package root
 *   3. counter - which increments for each call
 *
 * These elements are concatenated and hashed, using a shortened SHA256 hash.
 * IDs are guaranteed to be legal JS identifiers.
 *
 * If no file path, or root of package can be found, the code of the file is used instead of
 * package name and relative path.
 *
 * @param {Object} state - Babel state object
 * @param {Object} [options] - Options object
 * @param {string} [options.rootPath] - Package root provided by user (optional)
 * @param {boolean} [options.isPackage] - `true` if is a package
 * @param {string} [options.packageName] - Package name provided by user (optional)
 * @param {string} [options.packageVersion] - Package name provided by user (optional)
 * @param {number} [options.idLength] - Length of ID
 * @param {number} [options.pluginName] - Plugin name (used for error messages)
 * @param {number} [options.counterKey] - Counter key
 * @returns {string} - ID
 */
module.exports = function(state, options) {
	// Trim trailing slash from rootPath
	if (!options) options = {};
	const {rootPath} = options;
	if (rootPath && rootPath !== pathSeparator && rootPath.slice(-1) === pathSeparator) {
		options = {...options, rootPath: rootPath.slice(0, -1)};
	}

	// Use default ID length if not provided
	const idLength = options.idLength || DEFAULT_ID_LEN;

	// Conform static options
	let {counterKey} = options;
	if (!counterKey) counterKey = ID_COUNTER;

	const {pluginName} = options;
	const errorPrefix = pluginName ? `${pluginName}: ` : '';

	// Get cached ID string
	const {file} = state;
	let idStr = file.get(ID_STRING);

	// If not cached, calculate ID string from path
	// (or if no path, or no package root found, use hash of file's code instead)
	if (!idStr) {
		const path = file.opts.filename;
		if (path) idStr = getIdStrFromPath(path, options, errorPrefix);
		if (!idStr) idStr = `code:${sha256Hash(file.code)}`;

		file.set(ID_STRING, idStr);
	}

	// Add counter to ID string
	const count = file.get(counterKey) || 0;
	file.set(counterKey, count + 1);
	idStr += `:${count}`;

	// Return hash of ID string
	return shortHash(idStr, idLength);
};

/**
 * Get ID string from path.
 * @param {string} path - File path
 * @param {Object} options - Options object
 * @param {string} [options.rootPath] - Package root provided by user (optional)
 * @param {boolean} [options.isPackage] - `true` if is a package
 * @param {string} [options.packageName] - Package name provided by user (optional)
 * @param {string} [options.packageVersion] - Package name provided by user (optional)
 * @param {string} errorPrefix - Prefix for error messages
 * @returns {string} - Path and package name
 */
function getIdStrFromPath(path, options, errorPrefix) {
	// Find name and root path of package (or use options provided by user)
	const {isPackage} = options;
	let {rootPath, packageName, packageVersion} = options;
	if (rootPath) {
		// Root path provided - if isPackage option set, get name and version from package.json
		if (isPackage && !packageName) {
			const packageProps = readPackageJson(rootPath);
			validatePackage(packageProps, errorPrefix);
			packageName = packageProps.name;
			packageVersion = packageProps.name;
		}
	} else {
		// Root path not provided - find package.json and determine root path, name and version.
		// If no package.json file found, return undefined.
		const packageProps = findPackageRoot(path);
		if (!packageProps) return undefined;
		rootPath = packageProps.path;
		if (isPackage && !packageName) {
			validatePackage(packageProps, errorPrefix);
			packageName = packageProps.name;
			packageVersion = packageProps.version;
		}
	}

	// Get path relative to root
	let relativePath = pathRelative(rootPath, path);

	// Conform path to Posix-style so IDs will be same regardless of whether on Windows or Posix
	if (pathSeparator === '\\') relativePath = relativePath.replace(/\\/g, '/');

	// Return concatenation of package name/version and relative path
	return packageName
		? `package:${packageName}@${packageVersion}:${relativePath}`
		: `path:${relativePath}`;
}

function validatePackage(packageProps, errorPrefix) {
	const {name, version, pkgPath} = packageProps;
	invariant(version, `${errorPrefix}${pkgPath} does not contain a version field`);
	invariant(isString(name), `${errorPrefix}${pkgPath} contains non-string name field`);
	invariant(isString(version), `${errorPrefix}${pkgPath} contains non-string version field`);
}
