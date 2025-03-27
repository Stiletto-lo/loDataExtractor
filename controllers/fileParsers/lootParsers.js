/**
 * Loot parsers for handling loot-related data
 *
 * This module provides functions for parsing loot tables and loot sites
 * from game data files.
 */

const fs = require("node:fs");
const dataParser = require("../dataParsers");
const translator = require("../translator");
const dataTableTemplate = require("../../templates/datatable");
const dropDataTemplate = require("../../templates/dropData");
const creatureTemplate = require("../../templates/creature");
const utilityFunctions = require("./utilityFunctions");

// Environment configuration
const EXTRACT_ALL_DATA = process.env.EXTRACT_ALL_DATA === "true";

/**
 * Safely reads and parses a JSON file
 * @param {string} filePath - The file path to read
 * @returns {Object|null} - Parsed JSON data or null if error occurs
 */
const readJsonFile = (filePath) => {
	if (!filePath || typeof filePath !== "string") {
		console.error("Invalid file path provided to readJsonFile");
		return null;
	}

	try {
		const rawData = fs.readFileSync(filePath);
		return JSON.parse(rawData);
	} catch (error) {
		console.error(`Error reading or parsing file ${filePath}:`, error.message);
		return null;
	}
};

/**
 * Creates a drop item with optional properties based on configuration
 * @param {string} name - The name of the drop item
 * @param {Object} lootItemData - The loot item data containing properties
 * @returns {Object} - A configured drop item
 */
const createDropItem = (name, lootItemData) => {
	if (!name || !lootItemData) {
		console.warn("Missing required parameters for createDropItem");
		return { ...dropDataTemplate, name: name || "Unknown" };
	}

	const drop = { ...dropDataTemplate };
	drop.name = name;

	// Only add these properties if EXTRACT_ALL_DATA is true and they exist
	if (EXTRACT_ALL_DATA) {
		if (lootItemData.Chance) drop.chance = lootItemData.Chance;
		if (lootItemData.MinQuantity) drop.minQuantity = lootItemData.MinQuantity;
		if (lootItemData.MaxQuantity) drop.maxQuantity = lootItemData.MaxQuantity;
	}

	return drop;
};

/**
 * Determines the item name based on available data
 * @param {string} baseName - The base name from translation
 * @param {Object} lootItem - The loot item data
 * @returns {string} - The resolved item name
 */
const resolveItemName = (baseName, lootItem) => {
	if (!baseName || !lootItem) {
		return "Unknown Item";
	}

	if (!lootItem.Item || !lootItem.Item.AssetPathName) {
		return baseName;
	}

	const completeItem = utilityFunctions.getItemByType(
		dataParser.parseType(lootItem.Item.AssetPathName),
	);

	if (completeItem?.name) {
		return completeItem.name;
	}

	if (lootItem.Item.AssetPathName.includes("Schematics")) {
		return `${baseName} Schematic`;
	}

	return baseName;
};

/**
 * Validates loot table entry data
 * @param {Object} currentItem - The current loot item to validate
 * @param {string} key - The key of the current item
 * @returns {Object} - Object containing validation result and error message
 */
const validateLootTableEntry = (currentItem, key) => {
	if (!currentItem.Item) {
		return { isValid: false, error: `Missing Item property for ${key}` };
	}

	const baseName = dataParser.parseName(translator, key);
	if (!baseName) {
		return { isValid: false, error: `Could not parse name for ${key}` };
	}

	return { isValid: true, baseName };
};

/**
 * Parse loot table data from a file
 * @param {string} filePath - The file path to parse
 * @returns {boolean} - Whether parsing was successful
 */
const parseLootTable = (filePath) => {
	if (!filePath || typeof filePath !== "string") {
		console.error("Invalid file path provided to parseLootTable");
		return false;
	}

	const jsonData = readJsonFile(filePath);
	if (!jsonData) return false;

	const firstEntry = jsonData[0];
	if (
		!firstEntry?.Name ||
		!firstEntry?.Rows ||
		firstEntry?.Type !== "DataTable"
	) {
		console.warn(`Invalid data table format in ${filePath}`);
		return false;
	}

	const dataTable = { ...dataTableTemplate };
	dataTable.name = dataParser.parseName(translator, firstEntry.Name);
	const lootItems = firstEntry.Rows;
	const dataTableItems = [];

	for (const key of Object.keys(lootItems)) {
		const currentItem = lootItems[key];
		const validation = validateLootTableEntry(currentItem, key);

		if (!validation.isValid) {
			console.warn(validation.error);
			continue;
		}

		const resolvedName = resolveItemName(validation.baseName, currentItem);
		const hasDrop = dataTable.dropItems.some((d) => d.name === resolvedName);

		if (!hasDrop && resolvedName !== dataTable.name) {
			const drop = createDropItem(resolvedName, currentItem);
			dataTableItems.push(drop);
		}
	}

	dataTable.dropItems = dataTableItems;
	utilityFunctions.getAllDatatables().push(dataTable);
	return true;
};

/**
 * Get loot site name from object data
 * @param {Object} objectData - The object data
 * @returns {string|undefined} - The loot site name or undefined
 */
const getLootSiteNameFromObject = (objectData) => {
	if (!objectData || typeof objectData !== "object") {
		return undefined;
	}

	return objectData?.Properties?.MobName?.LocalizedString ||
		objectData?.Properties?.CampName?.LocalizedString ||
		undefined;
};

/**
 * Filter objects to exclude certain types
 * @param {Array} objects - Array of objects to filter
 * @returns {Array} - Filtered array of objects
 */
const filterRelevantObjects = (objects) => {
	if (!Array.isArray(objects)) {
		console.warn("Invalid objects array provided to filterRelevantObjects");
		return [];
	}

	return objects.filter(
		(obj) =>
			obj?.Type !== "Function" &&
			obj?.Type !== "BlueprintGeneratedClass" &&
			!obj?.Type?.includes("Component"),
	);
};

/**
 * Extract creature data from additional info
 * @param {Object} additionalInfo - The additional info object
 * @returns {Object} - Extracted creature properties
 */
const extractCreatureData = (additionalInfo) => {
	if (!additionalInfo) return {};

	return {
		experiencie: additionalInfo?.Properties?.ExperienceAward,
		health: additionalInfo?.Properties?.MaxHealth,
		lootTable: dataParser.parseObjectPath(
			additionalInfo?.Properties?.Loot?.ObjectPath,
		),
	};
};

/**
 * Parse loot sites data from a file
 * @param {string} filePath - The file path to parse
 * @returns {boolean} - Whether parsing was successful
 */
const parseLootSites = (filePath) => {
	if (!filePath || typeof filePath !== "string") {
		console.error("Invalid file path provided to parseLootSites");
		return false;
	}

	const jsonData = readJsonFile(filePath);
	if (!jsonData) return false;

	const objectsFiltered = filterRelevantObjects(jsonData);
	const firstObject = objectsFiltered[0];

	if (!firstObject) {
		console.warn(`No relevant objects found in ${filePath}`);
		return false;
	}

	const name = firstObject.Type;
	const translation = getLootSiteNameFromObject(firstObject);

	if (!translation || !name) {
		console.warn(`Missing name or translation for loot site in ${filePath}`);
		return false;
	}

	translator.addLootSiteTranslation(name, translation);

	const creature = {
		...creatureTemplate,
		type: name,
		name: translation,
		...extractCreatureData(
			jsonData.find((o) => o.Type === "MistHumanoidMobVariationComponent"),
		),
	};

	utilityFunctions.getCreatures().push(creature);
	return true;
};

module.exports = {
	parseLootTable,
	getLootSiteNameFromObject,
	parseLootSites,
};
