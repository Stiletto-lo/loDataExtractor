/**
 * Tech parser functions for handling tech-related data
 */

const fs = require("node:fs");
const dataParser = require("../../dataParsers");
const translator = require("../../translator");
const utilityFunctions = require("../utilityFunctions");
const { readJsonFile } = require("../../utils/read-json-file");

/**
 * Parse tech data from a file
 * @param {string} filePath - The file path to parse
 */
const parseTechData = (filePath) => {
	const jsonData = readJsonFile(filePath);

	if (jsonData?.[1]?.Type) {
		// Create both tech and item entries
		const tech = utilityFunctions.extractTechByType(jsonData[1].Type);

		// Set name for both
		const name = dataParser.parseName(translator, jsonData[1].Type);
		tech.name = translator.translateTechTreeName(name);

		const item = utilityFunctions.getItem(tech.name) ?? utilityFunctions.extractItemByType(jsonData[1].Type);

		// Extract parent data
		if (jsonData?.[1]?.Properties?.Requirements?.[0]?.ObjectName) {
			// Use specialized tech tree parent translation to ensure consistent parent-child relationships
			const parentName = translator.translateTechTreeName(
				dataParser.parseName(
					translator,
					jsonData[1].Properties.Requirements[0].ObjectName,
				),
			);
			tech.parent = parentName;
			item.parent = parentName;
		}

		// Extract Level and PointsCost data
		if (jsonData[1]?.Properties?.Level !== undefined) {
			tech.level = jsonData[1].Properties.Level;
		}

		if (jsonData[1]?.Properties?.PointsCost !== undefined) {
			tech.pointsCost = jsonData[1].Properties.PointsCost;
		}

		if (jsonData[1]?.Properties?.bHidden) {
			tech.onlyDevs = true;
			item.onlyDevs = true;
		}

		if (tech.name) {
			if (tech.name.includes("Upgrades")) {
				tech.category = "Upgrades";
				item.category = "Upgrades";
			} else if (tech.name.includes("Hook")) {
				tech.category = "Grappling Hooks";
				item.category = "Grappling Hooks";
			}
		}

		// Find items that this tech unlocks
		// This is the reverse relationship of the 'learn' array in schematic items
		const unlockedItems = findUnlockedItems(tech.type, tech.name);
		if (unlockedItems && unlockedItems.length > 0) {
			tech.unlocks = unlockedItems;
		}

		// Store both tech and item data
		utilityFunctions.addTechItem(tech);
		utilityFunctions.addItem(item);
	}
};

/**
 * Finds items that are unlocked by a specific tech
 * @param {string} techType - The type of the tech
 * @param {string} techName - The name of the tech
 * @returns {Array} - Array of item names that are unlocked by this tech
 */
const findUnlockedItems = (techType, techName) => {
	if (!techType || !techName) {
		return [];
	}

	// Get all items that have been parsed so far
	const allItems = utilityFunctions.getAllItems();

	// Find schematic items that might be related to this tech
	const relatedSchematics = allItems.filter((item) => {
		// Match by type (removing _C suffix if present)
		const baseType = techType.endsWith("_C") ? techType.slice(0, -2) : techType;
		const itemType = item.type?.endsWith("_C")
			? item.type.slice(0, -2)
			: item.type;

		// Check if the schematic type is related to the tech type
		const typeMatch =
			itemType &&
			baseType &&
			(itemType.includes(baseType) || baseType.includes(itemType));

		// Check if the schematic name is related to the tech name
		const nameMatch =
			item.name &&
			techName &&
			(item.name.includes(techName) || techName.includes(item.name));

		return (typeMatch || nameMatch) && item.category === "Schematics";
	});

	// Extract the items that these schematics unlock (from their 'learn' arrays)
	let unlockedItems = [];
	for (const schematic of relatedSchematics) {
		if (schematic.learn && Array.isArray(schematic.learn)) {
			unlockedItems = [...unlockedItems, ...schematic.learn];
		}
	}

	// If we couldn't find any related schematics, try to infer from tech name
	if (unlockedItems.length === 0) {
		// Look for items with similar names or categories
		const similarItems = allItems.filter((item) => {
			// Skip schematics and tech items themselves
			if (item.category === "Schematics" || item.type === techType) {
				return false;
			}

			// Check for name similarity
			if (item.name && techName) {
				// Extract key terms from tech name
				const techTerms = techName.toLowerCase().split(" ");
				const itemNameLower = item.name.toLowerCase();

				// Check if any significant term from tech name appears in item name
				for (const term of techTerms) {
					if (term.length > 3 && itemNameLower.includes(term)) {
						return true;
					}
				}
			}

			return false;
		});

		unlockedItems = similarItems.map((item) => item.name);
	}

	// Remove duplicates
	return [...new Set(unlockedItems)];
};

module.exports = {
	parseTechData,
};
