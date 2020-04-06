/* --------------------
 * babel-unique-id module
 * Tests
 * ------------------*/

/* eslint-disable jest/no-standalone-expect */

'use strict';

// Modules
const {join: pathJoin} = require('path');
const {create: createPluginTester} = require('babel-test');
const createId = require('../index.js');

// Init
require('./support/index.js');

// Create Babel plugin which adds an ID string to all function calls
function babelPlugin(api, options) {
	return {
		visitor: {
			CallExpression(callPath, state) {
				const id = createId(state, options);

				const stringPath = api.types.stringLiteral(id);
				callPath.pushContainer('arguments', stringPath);
			}
		}
	};
}

// Create `itTransforms()` test function
const babelTest = createPluginTester({plugins: [babelPlugin]}).test;
function itTransforms(name, fn) {
	return babelTest(name, ({transform}) => {
		async function transformShim(codeIn, options) {
			const {code} = await transform(codeIn, options);
			return code.replace(/\s*\n\s*\s?/g, '');
		}
		return fn(transformShim);
	});
}

// Tests

describe('Babel plugin', () => { // eslint-disable-line jest/lowercase-name
	it('is a function', () => {
		expect(babelPlugin).toBeFunction();
	});

	describe('creates IDs', () => {
		describe('with one call', () => {
			itTransforms('based on hash of code', async (transform) => {
				const res = await transform('foo();');
				// SHA256 hash of above code = 'qMVaiPhbudnaz91QqECVnbdTvKWnqeultnb/Nt/ybo8='
				// Short hash of 'code:qMVaiPhbudnaz91QqECVnbdTvKWnqeultnb/Nt/ybo8=:0' = 'AcQ5z4Sv'
				expect(res).toBe('foo("AcQ5z4Sv");');
			});

			itTransforms('based on relative path', async (transform) => {
				const res = await transform(
					'foo();',
					{filename: pathJoin(__dirname, 'foo.js')}
				);
				// Short hash of 'path:test/foo.js:0' = 'DxNA_4Ob'
				expect(res).toBe('foo("DxNA_4Ob");');
			});
		});

		describe('with two calls, adds different `id` for each', () => {
			itTransforms('based on hash of code', async (transform) => {
				const res = await transform('foo();bar();');
				// SHA256 hash of above code = 'Hf6KrDIS2z5zTl6j1nhBNnR3ltseJwfpVwUf3mSniBA='
				// Short hash of 'code:Hf6KrDIS2z5zTl6j1nhBNnR3ltseJwfpVwUf3mSniBA=:0' = 'SMKDpy00'
				// Short hash of 'code:Hf6KrDIS2z5zTl6j1nhBNnR3ltseJwfpVwUf3mSniBA=:1' = 'CRLVr5wz'
				expect(res).toBe('foo("SMKDpy00");bar("CRLVr5wz");');
			});

			itTransforms('based on relative path', async (transform) => {
				const res = await transform(
					'foo();bar();',
					{filename: pathJoin(__dirname, 'bar.js')}
				);
				// Short hash of 'path:test/bar.js:0' = 'CBaVcMlU'
				// Short hash of 'path:test/bar.js:1' = 'Cn86cOWC'
				expect(res).toBe('foo("CBaVcMlU");bar("Cn86cOWC");');
			});
		});
	});
});
