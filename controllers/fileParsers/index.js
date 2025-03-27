/**
 * Index file that exports all file parser functionality
 */

const blueprintParsers = require("./blueprintParsers");
const itemParsers = require("./itemParsers");
const lootParsers = require("./lootParsers");
const translationParsers = require("./translationParsers");
const upgradeParsers = require("./upgradeParsers");
const utilityFunctions = require("./utilityFunctions");

// Re-export all functionality from the individual modules
module.exports = {
	// Blueprint related functions
	parseLocation: blueprintParsers.parseLocation,
	parseBlueprintsToItems: blueprintParsers.parseBlueprintsToItems,
	parseLootBlueprint: blueprintParsers.parseLootBlueprint,

	// Item related functions
	getItemFromItemData: itemParsers.getItemFromItemData,
	parseItemData: itemParsers.parseItemData,
	parseSchematicItemData: itemParsers.parseSchematicItemData,
	parsePlaceableData: itemParsers.parsePlaceableData,
	parseTechData: itemParsers.parseTechData,
	parseDamage: itemParsers.parseDamage,
	parsePrices: itemParsers.parsePrices,
	parseCachedItems: itemParsers.parseCachedItems,

	// Loot related functions
	parseLootTable: lootParsers.parseLootTable,
	parseLootSites: lootParsers.parseLootSites,
	getLootSiteNameFromObject: lootParsers.getLootSiteNameFromObject,

	// Translation related functions
	parseTranslations: translationParsers.parseTranslations,
	parseOtherTranslations: translationParsers.parseOtherTranslations,

	// Upgrade related functions
	parseUpgrades: upgradeParsers.parseUpgrades,
	parseUpgradesToItems: upgradeParsers.parseUpgradesToItems,

	// Utility functions
	getItem: utilityFunctions.getItem,
	getItemByType: utilityFunctions.getItemByType,
	extractItemByType: utilityFunctions.extractItemByType,
	getIngredientsFromItem: utilityFunctions.getIngredientsFromItem,
	getAllItems: utilityFunctions.getAllItems,
	getUpgradesData: utilityFunctions.getUpgradesData,
	getCreatures: utilityFunctions.getCreatures,
	getAllDatatables: utilityFunctions.getAllDatatables,
	getAllBlueprints: utilityFunctions.getAllBlueprints,
	setAllItems: utilityFunctions.setAllItems,
	setUpgradesData: utilityFunctions.setUpgradesData,
	setCreatures: utilityFunctions.setCreatures,
	setAllDatatables: utilityFunctions.setAllDatatables,
	setAllBlueprints: utilityFunctions.setAllBlueprints,
};
