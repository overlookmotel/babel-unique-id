/* --------------------
 * babel-unique-id module
 * Hash functions
 * ------------------*/

'use strict';

// Modules
const {createHash} = require('crypto');

// Exports

module.exports = {
	shortHash,
	sha256Hash
};

/**
 * Create short hash string which can be used as a JS identifier.
 * SHA256 in base64 (using chars A-Z, a-z, 0-9, _, $), not starting with a digit,
 * and truncated to specified length.
 *
 * @param {string} str - String to hash
 * @param {number} len - Length of hash
 * @return {string} - Hash string
 */
function shortHash(str, len) {
	// Hash string
	const buffer = sha256Hash(str, true);

	// Lose a bit off first byte to avoid base64 string starting with digit
	buffer[0] &= 127; // eslint-disable-line no-bitwise

	// Convert to base64 string of desired length, replacing chars not legal in JS identifiers
	return buffer.toString('base64')
		.slice(0, len)
		.replace(/=+$/, '')
		.replace(/\+/g, '_')
		.replace(/\//g, '$');
}

/**
 * Calculate SHA256 hash of string.
 * @param {string} str - Input string
 * @param {boolean} [binary] - If true, returns buffer, otherwise base64 string
 * @returns {string|Buffer}
 */
function sha256Hash(str, binary) {
	return createHash('sha256').update(str).digest(binary ? undefined : 'base64');
}
