//@ts-nocheck

/**
 * Strongbox Drop Processor Module
 *
 * This module handles the processing of strongbox drops by connecting
 * strongbox types with the corresponding loot templates and loot tables.
 */

const fileParser = require("../../controllers/fileParsers");
const { tables } = require("../../templates/datatable");

/**
 * Extracts the tier from a table name
 * @param {string} tableName - The table name
 * @returns {string|null} - The extracted tier or null if not found
 */
function extractTierFromTableName(tableName) {
	if (!tableName) {
		return null;
	}

	// Common patterns: ammo_t1, baseresources_t2, etc.
	const tierMatch = tableName.match(/_t([1-4])(?:_|$)/i);
	if (tierMatch) {
		return `T${tierMatch[1]}`;
	}
	return null;
}

/**
 * Normalizes template names for consistent lookup
 * @param {Array} templates - Array of template objects
 * @returns {Object} - Map of normalized names to template objects
 */
function normalizeTemplates(templates) {
	const normalizedMap = {};

	for (const template of templates) {
		if (template.name) {
			// Normalize by removing _C suffix and converting to lowercase
			const normalizedName = template.name.replace(/_C$/i, "").toLowerCase();
			normalizedMap[normalizedName] = template;
		}
	}

	return normalizedMap;
}

/**
 * Converts loot tables to a map with lowercase keys for case-insensitive lookup
 * @param {Object} lootTables - Object containing loot tables
 * @returns {Object} - Map with normalized keys
 */
function normalizeLootTables(lootTables) {
	const normalizedMap = {};

	for (const tableName in lootTables) {
		normalizedMap[tableName.toLowerCase()] = lootTables[tableName];
	}

	return normalizedMap;
}

/**
 * Finds the appropriate template for a strongbox
 * @param {string} strongboxType - The strongbox type to look for
 * @param {Object} normalizedTemplates - Map of normalized template names
 * @returns {Object|null} - The found template or null
 */
function findTemplate(strongboxType, normalizedTemplates) {
	if (!strongboxType) {
		return null;
	}

	// Remove _C suffix and convert to lowercase for matching
	const normalizedType = strongboxType.replace(/_C$/i, "").toLowerCase();

	// First try direct match
	const template = normalizedTemplates[normalizedType];
	if (template) {
		return template;
	}

	// Try alternative matching strategies if direct match fails
	const alternativeNames = [
		`${normalizedType}_c`, // Try with _c suffix
		normalizedType.replace("_t", "t"), // Try different tier format
		normalizedType.replace("t", "_t"), // Try different tier format
	];

	for (const altName of alternativeNames) {
		if (normalizedTemplates[altName]) {
			console.debug(
				`Found template using alternative name ${altName} for ${strongboxType}`,
			);
			return normalizedTemplates[altName];
		}
	}

	return null;
}

/**
 * Processes drops from a loot table and adds them to a strongbox item
 * @param {Object} strongbox - The strongbox item to add drops to
 * @param {Object} lootTable - The loot table containing drops
 * @param {string} tableName - The name of the loot table (for source tracking)
 * @param {Object} tableRef - The table reference from the template with iteration and chance info
 */
function addDropsFromTable(strongbox, lootTable, tableName, tableRef) {
	// Verify that the loot table exists and has drops
	if (!lootTable?.drops || !Array.isArray(lootTable.drops)) {
		console.debug(
			`Loot table ${tableName} not found or has no valid drops for ${strongbox.name}`,
		);
		return;
	}

	// Ensure drops array exists
	if (!strongbox.drops) {
		strongbox.drops = [];
	}

	// Calculate multipliers from the table reference
	const runChance = tableRef.RunChance || 1.0;
	const perIterationRunChance = tableRef.PerIterationRunChance || 1.0;
	const minIterations = tableRef.MinIterations || 1;
	const maxIterations = tableRef.MaxIterations || 1;
	const minQuantityMultiplier = tableRef.MinQuantityMultiplier || 1.0;
	const maxQuantityMultiplier = tableRef.MaxQuantityMultiplier || 1.0;

	// Average iterations considering run chances
	const avgIterations = (minIterations + maxIterations) / 2;
	const effectiveIterations = avgIterations * perIterationRunChance;

	// Overall chance multiplier
	const chanceMultiplier = runChance * effectiveIterations;

	for (const drop of lootTable.drops) {
		// Calculate adjusted values based on the table reference parameters
		const adjustedChance = drop.chance * chanceMultiplier;
		const adjustedMinQuantity = Math.round(
			drop.minQuantity * minQuantityMultiplier,
		);
		const adjustedMaxQuantity = Math.round(
			drop.maxQuantity * maxQuantityMultiplier,
		);

		// Skip if this drop already exists
		const existingDrop = strongbox.drops.find((d) => d.name === drop.name);
		if (existingDrop) {
			continue;
		}

		// Add the drop to the strongbox
		strongbox.drops.push({
			name: drop.name,
			chance: adjustedChance,
			minQuantity: adjustedMinQuantity,
			maxQuantity: adjustedMaxQuantity,
			source: tableName,
		});
	}
}

/**
 * Adds drop information to strongbox items based on their type
 * @param {Array} items - The array of items to process
 * @param {Array} lootTemplates - The array of loot templates
 * @param {Object} lootTables - The object containing loot tables
 * @returns {Array} - Enhanced items with drop information
 */
function addDropInformation(items, lootTemplates, lootTables) {
	// Validate inputs
	if (!Array.isArray(items) || items.length === 0) {
		console.warn("No items to add drop information to");
		return items;
	}

	if (!lootTemplates || !lootTables) {
		console.warn("Missing loot templates or loot tables data");
		return items;
	}

	// Prepare normalized lookup maps
	const normalizedTemplates = normalizeTemplates(lootTemplates);
	const lootTablesMap = normalizeLootTables(lootTables);

	// Process each strongbox
	for (const strongbox of items) {
		// Find the matching template based on the strongbox type
		const templateToUse = findTemplate(strongbox.type, normalizedTemplates);
		if (!templateToUse) {
			continue;
		}

		// Process each table in the template
		if (
			templateToUse.tables &&
			Array.isArray(templateToUse.tables) &&
			templateToUse.tables.length > 0
		) {
			if (!strongbox.drops) {
				strongbox.drops = [];
			}

			for (const tableRef of templateToUse.tables) {
				const tableName = tableRef.name ? tableRef.name.toLowerCase() : null;
				if (!tableName) {
					continue;
				}

				const lootTable = lootTablesMap[tableName];
				addDropsFromTable(strongbox, lootTable, tableName, tableRef);
			}
		}
	}

	return items;
}

module.exports = {
	addDropInformation,
	normalizeTemplates,
	normalizeLootTables,
	findTemplate,
	addDropsFromTable,
	extractTierFromTableName,
};
