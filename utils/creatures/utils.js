/**
 * Creature Processing Utilities
 *
 * This module provides common utility functions for creature processing
 * that can be used across different parts of the creature processing pipeline.
 */

/**
 * Creates a map of items by name for faster lookup
 * @param {Array} items - The array of item objects
 * @returns {Map} - Map of items with name as key
 */
function createItemMap(items = []) {
	const itemMap = new Map();
	if (Array.isArray(items)) {
		for (const item of items) {
			if (item.name) {
				itemMap.set(item.name, item);
			}
		}
	}
	return itemMap;
}

/**
 * Validates a creature object to ensure it has required properties
 * @param {Object} creature - The creature object to validate
 * @returns {boolean} - Whether the creature is valid
 */
function isValidCreature(creature) {
	return creature?.name && Object.keys(creature).length > 2;
}

/**
 * Logs information about creature processing
 * @param {string} message - The message to log
 * @param {string} level - The log level (info, warn, error)
 */
function logCreatureProcessing(message, level = "info") {
	switch (level) {
		case "warn":
			console.warn(message);
			break;
		case "error":
			console.error(message);
			break;
		default:
			console.info(message);
			break;
	}
}

module.exports = {
	createItemMap,
	isValidCreature,
	logCreatureProcessing,
};
