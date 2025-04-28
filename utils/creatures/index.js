/**
 * Creature Processing Module
 *
 * This is the main entry point for creature processing functionality.
 * It integrates the various creature processing utilities and provides
 * a clean interface for the rest of the application.
 */

const fs = require("fs-extra");
const path = require("node:path");
const { convertToSnakeCase } = require("../../utils/convertToSnakeCase.js");

/**
 * Processes creature data to enhance it with additional information
 * @param {Array} creatures - The array of creature objects to process
 * @param {Object} translator - The translator object for localization
 * @param {Object} lootTables - The loot tables data for drop information
 * @param {Array} items - The array of item objects for drop information
 * @returns {Array} - Enhanced creature data
 */
const dropProcessor = require('./dropProcessor');
const templateCreatureGenerator = require('./templateCreatureGenerator');
const nameTranslator = require('./nameTranslator');

function processCreatures(creatures) {
	if (!Array.isArray(creatures) || creatures.length === 0) {
		console.warn("No creatures to process");
		return [];
	}

	console.info(`Processing ${creatures.length} creatures with enhanced data`);

	// First extract category and tier information
	let processedCreatures = creatures
		.map((creature) => extractCategoryAndTier(creature))
		.filter((creature) => creature.name && Object.keys(creature).length > 2);

	// Get loot data from fileParser
	const fileParser = require('../../controllers/fileParsers');
	const lootTemplates = fileParser.getAllLootTemplates();
	const lootTables = fileParser.getAllLootTables();

	const orphanCreatures = templateCreatureGenerator.createCreaturesForOrphanedTemplates();
	if (orphanCreatures.length > 0) {
		const processedOrphanCreatures = orphanCreatures
			.map((creature) => extractCategoryAndTier(creature))
			.filter((creature) => creature.name && Object.keys(creature).length > 2);

		processedCreatures = [...processedCreatures, ...processedOrphanCreatures];
	}

	// Then add drop information if loot data is available
	if (lootTemplates && lootTables) {
		console.info(`Found ${lootTemplates.length} loot templates and ${Object.keys(lootTables).length} loot tables`);
		processedCreatures = dropProcessor.addDropInformation(processedCreatures, lootTemplates, lootTables);

		// Log some debug information about drops
		const creaturesWithDrops = processedCreatures.filter(c => c.drops && c.drops.length > 0);
		console.info(`Added drops to ${creaturesWithDrops.length} creatures out of ${processedCreatures.length}`);
	}

	// Make creature names unique by adding tier information when needed
	processedCreatures = makeCreatureNamesUnique(processedCreatures);

	// Apply name translations if available
	processedCreatures = processedCreatures.map(creature => {
		if (creature.name) {
			const translatedName = nameTranslator.translateCreatureName(creature.name);
			if (translatedName !== creature.name) {
				return { ...creature, name: translatedName, originalName: creature.name };
			}
		}
		return creature;
	});

	return processedCreatures;
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
			// Translate the name if it exists in additionalTranslations
			const translatedName = nameTranslator.translateCreatureName(creature?.name);
			const dataToExport = {
				name: translatedName,
				category: creature?.category,
				tier: creature?.tier,
				health: creature?.health,
				experiencie: creature?.experiencie,
				drops: creature?.drops,
				originalName: translatedName !== creature?.name ? creature?.name : creature?.originalName
			}

			const snakeCaseName = convertToSnakeCase(translatedName);

			try {
				await fs.writeFile(
					path.join(creaturesFolder, `${snakeCaseName}.json`),
					JSON.stringify(dataToExport, null, 2),
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
	if (creature.lootTemplate?.includes("Rupu")) {
		creature.category = "Rupu";
	}

	return creature;
}

/**
 * Makes creature names unique by adding tier or category information when duplicates exist
 * @param {Array} creatures - The array of processed creature objects
 * @returns {Array} - Array of creatures with unique names
 */
function makeCreatureNamesUnique(creatures) {
	// First, identify duplicate names
	const nameCount = {};
	for (const creature of creatures) {
		if (creature.name) {
			nameCount[creature.name] = (nameCount[creature.name] || 0) + 1;
		}
	}

	// Create a map to track which names have been processed
	const processedNames = {};

	// Then, make names unique by adding tier or other information
	return creatures.map(creature => {
		if (!creature.name || nameCount[creature.name] <= 1) {
			// No need to modify unique names
			return creature;
		}

		// Clone the creature to avoid modifying the original
		const modifiedCreature = { ...creature };

		// Track how many times we've seen this name
		processedNames[creature.name] = (processedNames[creature.name] || 0) + 1;

		// If the creature has a tier, add it to the name
		if (creature.tier) {
			modifiedCreature.name = `${creature.name} (${creature.tier})`;
		}
		// If no tier but has category, use that
		else if (creature.category) {
			modifiedCreature.name = `${creature.name} (${creature.category})`;
		}
		// If neither, add a number suffix
		else {
			modifiedCreature.name = `${creature.name} (${processedNames[creature.name]})`;
		}

		return modifiedCreature;
	});
}

module.exports = {
	processCreatures,
	exportIndividualCreatureFiles,
};
