/**
 * Index file that exports all item parser functionality
 */

const generalItemParser = require("./generalItemParser");
const schematicParser = require("./schematicParser");
const placeableParser = require("./placeableParser");
const techParser = require("./techParser");
const damageParser = require("./damageParser");
const cachedItemsParser = require("./cachedItemsParser");
const pricesParser = require("./pricesParser");

// Re-export all functionality from the individual modules
module.exports = {
	// General item related functions
	getItemFromItemData: generalItemParser.getItemFromItemData,
	parseItemData: generalItemParser.parseItemData,

	// Schematic related functions
	parseSchematicItemData: schematicParser.parseSchematicItemData,

	// Placeable related functions
	parsePlaceableData: placeableParser.parsePlaceableData,

	// Tech data related functions
	parseTechData: techParser.parseTechData,

	// Damage related functions
	parseDamage: damageParser.parseDamage,

	// Cached items related functions
	parseCachedItems: cachedItemsParser.parseCachedItems,

	// Prices related functions
	parsePrices: pricesParser.parsePrices,
};
