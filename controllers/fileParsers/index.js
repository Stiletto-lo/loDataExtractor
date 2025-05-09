/**
 * Index file that exports all file parser functionality
 */

const itemParsers = require("./itemParsers");
const lootParsers = require("./lootParsers");
const translationParsers = require("./translationParsers");
const upgradeParsers = require("./upgradeParsers");
const vehicleParser = require("./vehicleParser");
const utilityFunctions = require("./utilityFunctions");
const translator = require("../translator");
const itemNameGlossary = require("./itemNameGlossary");

// Re-export all functionality from the individual modules
module.exports = {
	// Vehicle related functions
	parseVehicleData: vehicleParser.parseVehicleData,
	processVehicleFiles: vehicleParser.processVehicleFiles,

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
	parseLootTemplate: lootParsers.parseLootTemplate,
	getAllLootTables: utilityFunctions.getAllLootTables,
	setLootTables: utilityFunctions.setLootTables,
	getAllLootTemplates: utilityFunctions.getAllLootTemplates,
	setLootTemplates: utilityFunctions.setLootTemplates,

	// Translation related functions
	parseTranslations: translationParsers.parseTranslations,
	parseOtherTranslations: translationParsers.parseOtherTranslations,
	parseStringTables: translationParsers.parseStringTables,

	// Upgrade related functions
	parseUpgrades: upgradeParsers.parseUpgrades,
	parseUpgradesToItems: upgradeParsers.parseUpgradesToItems,

	// Utility functions
	getItem: utilityFunctions.getItem,
	getItemByType: utilityFunctions.getItemByType,
	extractItemByType: utilityFunctions.extractItemByType,
	getIngredientsFromItem: utilityFunctions.getIngredientsFromItem,
	getAllItems: utilityFunctions.getAllItems,
	getTechData: utilityFunctions.getTechData,
	setTechData: utilityFunctions.setTechData,
	extractTechByType: utilityFunctions.extractTechByType,
	getUpgradesData: utilityFunctions.getUpgradesData,
	getCreatures: utilityFunctions.getCreatures,
	setAllItems: utilityFunctions.setAllItems,
	setUpgradesData: utilityFunctions.setUpgradesData,
	setCreatures: utilityFunctions.setCreatures,

	// Translator
	getTranslator: () => translator,

	// Item name glossary functions
	buildItemNameGlossary: itemNameGlossary.buildItemNameGlossary,
	getDisplayName: itemNameGlossary.getDisplayName,
	getGlossary: itemNameGlossary.getGlossary,
	saveGlossary: itemNameGlossary.saveGlossary,
};
