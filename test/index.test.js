/* --------------------
 * babel-unique-id module
 * Tests
 * ------------------*/

'use strict';

// Modules
const babelUniqueId = require('../index');

// Init
require('./support');

// Tests

describe('tests', () => {
	it.skip('all', () => { // eslint-disable-line jest/no-disabled-tests
		expect(babelUniqueId).not.toBeUndefined();
	});
});
