/* --------------------
 * babel-unique-id module
 * Find package root
 * ------------------*/

'use strict';

// Modules
const fs = require('fs'),
	{join: pathJoin, dirname} = require('path');

// Exports

module.exports = {
	findPackageRoot,
	readPackageJson
};

/**
 * Find first folder above file which contains a `package.json` file with `name` defined.
 * i.e. The root of the app/package.
 *
 * `package.json` files without `name` defined are ignored because `package.json` is also used
 * to tell Node whether files in folder are ESM modules using `{type: 'module'}`.
 * Those `package.json` files do not indicate the root of a package.
 *
 * Returns an object of form `{name, version, path, pkgPath}`.
 * If no package root can be found, returns undefined.
 *
 * @param {string} path - Path of current file
 * @returns {Object|undefined}
 * @returns {*} .name - Package name (string if `package.json` is well-formed)
 * @returns {*} .version - Package version (string if `package.json` is well-formed)
 * @returns {string} .path - Path of root of package
 * @returns {string} .pkgPath - Path of package.json file found
 */
function findPackageRoot(path) {
	while (true) { // eslint-disable-line no-constant-condition
		const parentPath = dirname(path);

		// If reached root, return root path
		if (parentPath === path) return undefined;
		path = parentPath;

		const props = readPackageJson(path);
		if (props) return props;
	}
}

function readPackageJson(path) {
	// Try to read contents of `package.json`.
	// If file not found, return undefined.
	const pkgPath = pathJoin(path, 'package.json');
	let pkgStr;
	try {
		pkgStr = fs.readFileSync(pkgPath, 'utf8');
	} catch (err) {
		if (err.code !== 'ENOENT') throw err;
		return undefined;
	}

	// Parse file
	const pkgObj = JSON.parse(pkgStr);

	// Skip if does not have name field
	const {name, version} = pkgObj;
	if (!name) return undefined;

	// Return details
	return {name, version, path, pkgPath};
}
