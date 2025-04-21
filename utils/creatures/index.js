/**
 * Creature Processing Module
 *
 * This is the main entry point for creature processing functionality.
 * It integrates the various creature processing utilities and provides
 * a clean interface for the rest of the application.
 */

const fs = require("fs-extra");
const path = require("node:path");

/**
 * Processes creature data to enhance it with additional information
 * @param {Array} creatures - The array of creature objects to process
 * @param {Object} translator - The translator object for localization
 * @param {Object} dataTables - The loot tables data for drop information
 * @param {Array} items - The array of item objects for drop information
 * @returns {Array} - Enhanced creature data
 */
function processCreatures(creatures, translator, dataTables = {}) {
	if (!Array.isArray(creatures) || creatures.length === 0) {
		console.warn("No creatures to process");
		return [];
	}

	console.info(`Processing ${creatures.length} creatures with enhanced data`);

	return creatures
		.map((creature) => extractCategoryAndTier(creature))
		.filter((creature) => creature.name && Object.keys(creature).length > 2);
}

/**
 * Exports creatures to individual JSON files
 * @param {Array} creatures - The array of processed creature objects
 * @param {string} exportFolder - The folder path to export to
 */
async function exportIndividualCreatureFiles(creatures, exportFolder) {
	if (!Array.isArray(creatures) || creatures.length === 0) {
		console.warn("No creatures to export individually");
		return;
	}

	const creaturesFolder = path.join(exportFolder, "creatures");
	await fs.ensureDir(creaturesFolder);

	console.info(
		`Exporting ${creatures.length} individual creature files to ${creaturesFolder}`,
	);

	for (const creature of creatures) {
		if (creature.name) {
			const snakeCaseName = convertToSnakeCase(creature.name);

			try {
				await fs.writeFile(
					path.join(creaturesFolder, `${snakeCaseName}.json`),
					JSON.stringify(creature, null, 2),
				);
			} catch (err) {
				console.error(
					`Error creating individual file for ${creature.name}:`,
					err,
				);
			}
		}
	}

	console.log("Individual creature JSON files exported");
}

/**
 * Converts a string to snake_case for filenames
 * @param {string} str - The string to convert
 * @returns {string} - The snake_case string
 */
function convertToSnakeCase(str) {
	return str
		.toLowerCase()
		.replace(/\s+/g, "_") // Replace spaces with underscores
		.replace(/[^a-z0-9_]/g, "") // Remove any non-alphanumeric characters except underscores
		.replace(/_+/g, "_"); // Replace multiple underscores with a single one
}

/**
 * Extracts category and tier information from creature type
 * @param {Object} creature - The creature object to process
 * @returns {Object} - The creature object with category and tier information
 */
function extractCategoryAndTier(creature) {
	if (creature.type && !creature.category) {
		const typeMatch = creature.type.match(/T(\d)_(\w+)_C/);
		if (typeMatch) {
			// If not already set, extract from type
			if (!creature.tier) {
				creature.tier = `T${typeMatch[1]}`;
			}

			// If category not set and we can extract it from type
			if (!creature.category && typeMatch[2]) {
				// Convert from camelCase to readable format (e.g., RupuWarrior -> Rupu)
				const categoryName = typeMatch[2].replace(/([a-z])([A-Z])/g, "$1 $2");
				// Usually the first word is the category (e.g., "Rupu" from "Rupu Warrior")
				creature.category = categoryName.split(" ")[0];
			}
		}
	}

	// Set category based on loot table for specific cases - this takes precedence over type-based category
	if (creature.lootTable?.includes("Rupu")) {
		creature.category = "Rupu";
	}

	return creature;
}

module.exports = {
	processCreatures,
	exportIndividualCreatureFiles,
};
