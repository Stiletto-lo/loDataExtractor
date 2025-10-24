/**
 * Loot parsers for handling loot-related data
 *
 * This module provides functions for parsing loot tables and loot sites
 * from game data files.
 */

const fs = require("node:fs");
const path = require("node:path");
const dataParser = require("../dataParsers");
const translator = require("../translator");
const dataTableTemplate = require("../../templates/datatable");
const lootTableTemplate = require("../../templates/lootTable");
const dropDataTemplate = require("../../templates/dropData");
const creatureTemplate = require("../../templates/creature");
const utilityFunctions = require("./utilityFunctions");
const lootTemplateParser = require("./lootParsers/lootTemplateParser");
const { readJsonFile } = require("../utils/read-json-file");

// Output directories
const OUTPUT_DIR = path.join(__dirname, "../../exported");
const LOOTTABLES_DIR = path.join(OUTPUT_DIR, "loot_tables");
const CREATURE_DATA_DIR = path.join(
	__dirname,
	"../../..",
	"Mist",
	"Content",
	"Mist",
	"Characters"
); // Assuming this path structure from the .md

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(LOOTTABLES_DIR)) {
	fs.mkdirSync(LOOTTABLES_DIR, { recursive: true });
}

/**
 * Creates a drop item with optional properties based on configuration
 * @param {string} name - The name of the drop item
 * @param {Object} lootItemData - The loot item data containing properties
 * @returns {Object} - A configured drop item
 */
const createDropItem = (name, lootItemData) => {
	if (!name || !lootItemData) {
		return undefined;
	}

	const drop = { ...dropDataTemplate };
	drop.name = name;

	if (lootItemData.Chance) {
		drop.chance = lootItemData.Chance;
	}
	if (lootItemData.MinQuantity) {
		drop.minQuantity = lootItemData.MinQuantity;
	}
	if (lootItemData.MaxQuantity) {
		drop.maxQuantity = lootItemData.MaxQuantity;
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

	if (!lootItem?.Item?.AssetPathName) {
		return baseName;
	}

	const completeItem = utilityFunctions.getItemByType(
		dataParser.parseType(lootItem.Item.AssetPathName)
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
	if (!jsonData) {
		return false;
	}

	const firstEntry = jsonData[0];
	if (
		!firstEntry?.Name ||
		!firstEntry?.Rows ||
		firstEntry?.Type !== "DataTable"
	) {
		return false;
	}

	const dataTable = { ...dataTableTemplate };
	dataTable.name = dataParser.parseName(translator, firstEntry.Name);
	dataTable.objectName = firstEntry.Name;
	dataTable.objectPath = firstEntry.ObjectPath || "";
	const lootItems = firstEntry.Rows;
	const tableItems = [];

	// Create a loot table for this data table
	const lootTable = { ...lootTableTemplate };
	lootTable.name = dataTable.name;
	lootTable.objectName = firstEntry.Name;
	lootTable.objectPath = firstEntry.ObjectPath || "";

	// Store loot table information for creature processing
	const lootTables = utilityFunctions.getAllLootTables
		? utilityFunctions.getAllLootTables()
		: {};
	lootTables[firstEntry.Name] = {
		name: dataTable.name,
		drops: [],
	};

	for (const key of Object.keys(lootItems)) {
		const currentItem = lootItems[key];
		const validation = validateLootTableEntry(currentItem, key);

		if (!validation.isValid) {
			console.warn(validation.error);
			continue;
		}

		const resolvedName = resolveItemName(validation.baseName, currentItem);
		// Check if this item already exists in the tables array
		const hasDrop = tableItems.some((d) => d.name === resolvedName);

		if (!hasDrop && resolvedName !== dataTable.name) {
			const drop = createDropItem(resolvedName, currentItem);

			const itemName = translator.translateName(resolvedName);

			if (!drop) {
				continue;
			}

			tableItems.push(drop);

			// Add to the loot table drops array
			lootTable.drops.push(drop);

			// Add to the loot tables collection for creature processing
			lootTables[firstEntry.Name].drops.push({
				name: itemName,
				chance: currentItem.Chance,
				minQuantity: currentItem.MinQuantity,
				maxQuantity: currentItem.MaxQuantity,
			});
		}
	}

	// Use tables property to store only the unique items, not the lootTable itself
	dataTable.tables = tableItems;

	// Update loot tables in the utility functions if the function exists
	if (utilityFunctions.setLootTables) {
		utilityFunctions.setLootTables(lootTables);
	}

	// Export to the datatables directory
	const fileName = dataTable.name.replace(/\s+/g, "_").toLowerCase();
	// Export loot table information to the loot_tables directory
	if (lootTables[firstEntry.Name]) {
		const lootTablePath = path.join(LOOTTABLES_DIR, `${fileName}.json`);
		fs.writeFileSync(
			lootTablePath,
			JSON.stringify(lootTables[firstEntry.Name], null, 2)
		);
	}

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

	return (
		objectData?.Properties?.MobName?.LocalizedString ||
		objectData?.Properties?.CampName?.LocalizedString ||
		undefined
	);
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
			!obj?.Type?.includes("Component")
	);
};

/**
 * Extract creature data from additional info
 * @param {Object} additionalInfo - The additional info object from the main creature file (e.g., BP_Worm.json)
 * @param {Object} objectData - The primary object data for the creature.
 * @returns {Object} - Extracted creature properties
 */
const extractCreatureData = (additionalInfo, objectData, fullCreatureData = null) => {
	if (!additionalInfo && !objectData && !fullCreatureData) {
		return {};
	}

	// Initialize result object
	const result = {};

	// If we have fullCreatureData (array of components), search through all components
	if (fullCreatureData && Array.isArray(fullCreatureData)) {
		// Search for MistCreatureComponent or MistAnimalMobVariationComponent (contains MaxHealth and ExperienceAward)
		const creatureComponent = fullCreatureData.find(obj =>
			obj.Type === "MistCreatureComponent" || obj.Type === "MistAnimalMobVariationComponent"
		);
		if (creatureComponent?.Properties) {
			result.health = creatureComponent.Properties.MaxHealth;
			result.experience = creatureComponent.Properties.ExperienceAward;
			result.lootTemplate = dataParser.parseObjectPath(creatureComponent.Properties.Loot?.ObjectPath);
		}

		// Search for MistPhysicalMobAttackArea (contains Damage)
		const attackComponent = fullCreatureData.find(obj => obj.Type === "MistPhysicalMobAttackArea");
		if (attackComponent?.Properties) {
			result.damage = attackComponent.Properties.Damage;
		}

		// Search for MistPhysicalMobMovement (contains MaxSpeed)
		const movementComponent = fullCreatureData.find(obj => obj.Type === "MistPhysicalMobMovement");
		if (movementComponent?.Properties) {
			// Extract speed from Sprint or Walk, preferring Sprint
			if (movementComponent.Properties.Sprint?.MaxSpeed) {
				result.speed = movementComponent.Properties.Sprint.MaxSpeed;
			} else if (movementComponent.Properties.Walk?.MaxSpeed) {
				result.speed = movementComponent.Properties.Walk.MaxSpeed;
			}
		}
	} else {
		// Fallback to original logic for backward compatibility
		const props = additionalInfo?.Properties || objectData?.Properties || {};

		result.experience = props.ExperienceAward;
		result.health = props.MaxHealth;
		result.lootTemplate = dataParser.parseObjectPath(props.Loot?.ObjectPath);
		result.speed = props.MovementSpeed || props.WalkSpeed;
	}

	// Extract category information from objectData
	if (objectData) {
		const typeStr = objectData.Type || "";

		if (typeStr.includes("Rupu")) result.category = "Rupu";
		else if (typeStr.includes("Nurr")) result.category = "Nurr";
		else if (typeStr.includes("Killin")) result.category = "Killin";
		else if (typeStr.includes("Okkam")) result.category = "Okkam";
		else if (typeStr.includes("Papak")) result.category = "Papak";
		else if (typeStr.includes("Phemke")) result.category = "Phemke";
		else if (typeStr.toLowerCase().includes("worm")) result.category = "Worm";
		else if (typeStr.includes("Spider")) result.category = "Spider";
		else if (typeStr.includes("Crab")) result.category = "Crab";
		else if (typeStr.includes("Beetle")) result.category = "Beetle";
		else if (typeStr.includes("Gogo")) result.category = "Rock Crawler";
	}

	return result;
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
	if (!jsonData) {
		return false;
	}

	const objectsFiltered = filterRelevantObjects(jsonData);
	const firstObject = objectsFiltered[0];

	if (!firstObject) {
		return false;
	}

	const name = firstObject.Type;
	const translation = getLootSiteNameFromObject(firstObject);

	if (!translation || !name) {
		return false;
	}

	translator.addTranslationInUse(name, translation);

	// Find additional components that might contain useful information
	// This could be a specific component like MistHumanoidMobVariationComponent or the main object itself
	const mobVariationComponent = jsonData.find(
		(o) => o.Type === "MistHumanoidMobVariationComponent"
	);
	const primaryDataSource = mobVariationComponent || firstObject;

	// Extract creature data with enhanced information
	const creatureData = extractCreatureData(primaryDataSource, firstObject, jsonData);

	// Create the creature object with all available information
	const creature = {
		...creatureTemplate,
		type: name, // This is the internal type, e.g., BP_Worm_C
		name: translation, // This is the display name, e.g., The Long One
		...creatureData,
	};

	// Add to the creatures collection
	utilityFunctions.addCreature(creature);

	// Export creature data with loot information
	if (creature.lootTemplate) {
		const fileName = creature.name.replace(/\s+/g, "_").toLowerCase();
		const filePath = path.join(OUTPUT_DIR, "creatures", `${fileName}.json`);

		// Ensure creatures directory exists
		if (!fs.existsSync(path.join(OUTPUT_DIR, "creatures"))) {
			fs.mkdirSync(path.join(OUTPUT_DIR, "creatures"), { recursive: true });
		}

		fs.writeFileSync(filePath, JSON.stringify(creature, null, 2));
	}

	return true;
};

module.exports = {
	parseLootTable,
	getLootSiteNameFromObject,
	parseLootSites,
	parseLootTemplate: lootTemplateParser.parseLootTemplate,
};
