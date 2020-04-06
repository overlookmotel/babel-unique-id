[![NPM version](https://img.shields.io/npm/v/babel-unique-id.svg)](https://www.npmjs.com/package/babel-unique-id)
[![Build Status](https://img.shields.io/travis/overlookmotel/babel-unique-id/master.svg)](http://travis-ci.org/overlookmotel/babel-unique-id)
[![Dependency Status](https://img.shields.io/david/overlookmotel/babel-unique-id.svg)](https://david-dm.org/overlookmotel/babel-unique-id)
[![Dev dependency Status](https://img.shields.io/david/dev/overlookmotel/babel-unique-id.svg)](https://david-dm.org/overlookmotel/babel-unique-id)
[![Greenkeeper badge](https://badges.greenkeeper.io/overlookmotel/babel-unique-id.svg)](https://greenkeeper.io/)
[![Coverage Status](https://img.shields.io/coveralls/overlookmotel/babel-unique-id/master.svg)](https://coveralls.io/r/overlookmotel/babel-unique-id)

# Utility for Babel plugins to create unique IDs

## Usage

Your Babel plugin may need to create IDs for every instance of a certain function call/object in an app.

An example is [Styled Components' Babel plugin](https://styled-components.com/docs/tooling#babel-plugin) which adds a unique identifier to every styled component so that server-generated code can be matched up on the client.

This package is a utility to create such IDs in Babel plugins.

### Installation

```
npm i babel-unique-id
```

### Usage

```js
// Babel plugin called 'my-babel-plugin'
const createId = require('babel-unique-id');

const ID_OPTIONS = {
  pluginName: 'my-babel-plugin'
};

module.exports = function(api, options) {
  return {
    visitor: {
      CallExpression(path, state) {
        const id = createId(
          state,
          { ...options, ...ID_OPTIONS }
        );
        // Now do something with id...
      }
    }
  };
};
```

### How IDs are created

IDs are a hash of a combination of 4 elements:

1. ID type
2. Path of file relative to root of application/package
3. Package name + version (if a package not an app)
4. Counter which increments within each file

#### ID type

`path` for application files, `package` for package files, `code` if no path is available.

#### File path

The root of the application/package is determined by searching up the file tree for a `package.json` file. `package.json` files without a `name` property are ignored (due to how they are used for [NodeJS ESM modules](https://nodejs.org/dist/latest-v12.x/docs/api/esm.html#esm_package_json_type_field)).

The root path can alternatively be set manually with the [`rootPath` option](#rootpath).

If the root of the app/package is found, the path of the file being processed *relative* to the root is used. Windows-style path separators (`\`) are converted to POSIX-style (`/`). This should ensure that for the same code base, IDs are deterministic regardless of path where the app/package repo is installed, and what platform it's running on.

If there is no file path provided by Babel, or no `package.json` file can be found, a hash of the input's code is used instead of relative path.

#### Package name + version

Package name and version are also included if [`packageName`](#packagename) and [`packageVersion`](#packageversion) or [`isPackage`](#ispackage) options are provided.

#### Counter

The counter starts at zero *for each file* and increments each time an ID is used. So multiple IDs created in same file will differ from each other.

#### Putting the elements together

The 4 elements are concatenated:

* `path:lib/index.js:1`
* `package:mypackage@1.0.0:lib/index.js:1`
* `code:<SHA256 hash of code>:1`

These strings should be globally unique within an application.

Then a SHA256 hash is calculated of this string, and it is base64 encoded. The string is truncated according to [`idLength`](#idlength) option.

IDs are guaranteed to be valid JS identifiers. Chars used are `a-zA-Z0-9$_` and IDs will never start with a digit.

### API

```js
const id = createId( state, options );
```

### Options

#### `rootPath`

Intended to be set by user.

See [above](#file-path).

#### `packageName`

Intended to be set by user.

If the Babel plugin's user is compiling code in a package being published to NPM, they should either provide `packageName` and `packageVersion` options or set `isPackage` option to `true`.

The package name and version will be used in creation of IDs, which will ensure IDs created in one NPM package don't collide with those created in another package if the relative paths are the same (e.g. 'index.js').

If `packageName` is provided, `packageVersion` must be too, and vica-versa.

#### `packageVersion`

Intended to be set by user.

See [`packageName`](#packagename).

#### `isPackage`

Intended to be set by user.

If `isPackage` option is set, the package's name and version are read from `package.json`.

#### `idLength`

Intended to be set by either user or plugin.

By default, IDs are 8 chars long (47 bits).

Use `idLength` option to alter that. 41 chars is maximum length.

#### `pluginName`

Intended to be set by plugin.

Name of your Babel plugin. It is optional, but if provided then the plugin name will prefix any error messages, which makes it easier for the user to understand when they get an error.

#### `counterKey`

Intended to be set by plugin.

In some cases, it may be advantageous for IDs to remain as static as possible despite changes in the code base.

If that's the case for your plugin, provide a Symbol as `counterKey` option. The counter used for IDs created by your plugin will then be independent from other plugins which also use `babel-unique-id`. On the other hand, IDs used by your plugin may now collide with IDs created by other plugins, so make sure the way the IDs are used means this isn't a problem.

```js
const ID_OPTIONS = {
  pluginName: 'my-babel-plugin',
  counterKey: Symbol('my-babel-plugin.ID_COUNTER')
};

function visitor(path, state, options) {
  const id = createId(
		state,
		{ ...options, ...ID_OPTIONS }
	);
  // Do something with id...
}
```

## Versioning

This module follows [semver](https://semver.org/). Breaking changes will only be made in major version updates.

All active NodeJS release lines are supported (v10+ at time of writing). After a release line of NodeJS reaches end of life according to [Node's LTS schedule](https://nodejs.org/en/about/releases/), support for that version of Node may be dropped at any time, and this will not be considered a breaking change. Dropping support for a Node version will be made in a minor version update (e.g. 1.2.0 to 1.3.0). If you are using a Node version which is approaching end of life, pin your dependency of this module to patch updates only using tilde (`~`) e.g. `~1.2.3` to avoid breakages.

## Tests

Use `npm test` to run the tests. Use `npm run cover` to check coverage.

## Changelog

See [changelog.md](https://github.com/overlookmotel/babel-unique-id/blob/master/changelog.md)

## Issues

If you discover a bug, please raise an issue on Github. https://github.com/overlookmotel/babel-unique-id/issues

## Contribution

Pull requests are very welcome. Please:

* ensure all tests pass before submitting PR
* add tests for new features
* document new functionality/API additions in README
* do not add an entry to Changelog (Changelog is created when cutting releases)
