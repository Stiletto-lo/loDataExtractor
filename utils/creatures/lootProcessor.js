/**
 * Creature Loot Processor Utility
 *
 * This module is responsible for processing loot information for creatures,
 * including drop chances, quantities, and related item information.
 */

/**
 * Processes loot information for a creature
 * @param {Object} creature - The creature object to process loot for
 * @param {Object} dataTables - The loot tables data for drop information
 * @param {Array} items - The array of item objects for drop information
 * @returns {Object} - The creature object with processed loot information
 */
function processCreatureLoot(creature, dataTables = {}, items = []) {
	// Create a map of items by name for faster lookup
	const itemMap = new Map();
	if (Array.isArray(items)) {
		for (const item of items) {
			if (item.name) {
				itemMap.set(item.name, item);
			}
		}
	}

	// Process loot table to extract drop information
	if (creature.lootTable) {
		// Check if we have the loot table in our data
		const dataTable = dataTables[creature.lootTable];

		// If we don't have the data table in memory, try to find the loot template file
		if (!dataTable) {
			// Look for the loot template file in the exported directory
			try {
				// Try to find the loot template file by name pattern
				const fs = require("fs-extra");
				const path = require("path");
				const exportDir = path.join(
					process.cwd(),
					"exported",
					"loot_templates",
				);

				// Search for the loot template file in subdirectories
				let lootTemplateFile = null;
				const searchLootTemplate = (dir, lootTableName) => {
					if (!fs.existsSync(dir)) return null;

					const files = fs.readdirSync(dir, { withFileTypes: true });

					for (const file of files) {
						const filePath = path.join(dir, file.name);

						if (file.isDirectory()) {
							const result = searchLootTemplate(filePath, lootTableName);
							if (result) return result;
						} else if (
							file.name.toLowerCase().includes(lootTableName.toLowerCase()) &&
							file.name.endsWith(".json")
						) {
							return filePath;
						}
					}

					return null;
				};

				lootTemplateFile = searchLootTemplate(exportDir, creature.lootTable);

				if (lootTemplateFile) {
					// Read and parse the loot template file
					const lootTemplateData = JSON.parse(
						fs.readFileSync(lootTemplateFile, "utf8"),
					);

					// Add drops information to the creature
					if (
						lootTemplateData &&
						lootTemplateData.tables &&
						lootTemplateData.tables.length > 0
					) {
						// Add drops array to store all possible drops
						creature.drops = [];

						// Process each table in the loot template
						for (const table of lootTemplateData.tables) {
							if (table.drops && Array.isArray(table.drops)) {
								// Calculate the effective chance based on table run chance
								const tableRunChance = table.runChance || 1;

								// Add each drop to the creature's drops array
								for (const drop of table.drops) {
									if (drop.name && drop.chance) {
										// Calculate effective drop chance considering table run chance
										const effectiveChance = (
											(drop.chance * tableRunChance) /
											100
										).toFixed(4);

										// Create drop entry
										const dropEntry = {
											name: drop.name,
											chance: Number.parseFloat(effectiveChance),
											minQuantity: drop.minQuantity || 1,
											maxQuantity: drop.maxQuantity || 1,
										};

										// Check if this item already exists in the drops array
										const existingDropIndex = creature.drops.findIndex(
											(d) => d.name === drop.name,
										);

										if (existingDropIndex >= 0) {
											// Update existing drop with higher chance and quantities
											const existingDrop = creature.drops[existingDropIndex];
											existingDrop.chance = Math.max(
												existingDrop.chance,
												dropEntry.chance,
											);
											existingDrop.minQuantity = Math.max(
												existingDrop.minQuantity,
												dropEntry.minQuantity,
											);
											existingDrop.maxQuantity = Math.max(
												existingDrop.maxQuantity,
												dropEntry.maxQuantity,
											);
										} else {
											// Add new drop to the array
											creature.drops.push(dropEntry);
										}
									}
								}
							}
						}

						// Sort drops by chance (highest first) and then by name
						if (creature.drops.length > 0) {
							creature.drops.sort((a, b) => {
								if (b.chance !== a.chance) {
									return b.chance - a.chance;
								}
								return a.name.localeCompare(b.name);
							});
						}
					}
				}
			} catch (error) {
				console.error(
					`Error processing loot template for ${creature.name}:`,
					error.message,
				);
			}
		}

		// Process in-memory data table if available
		if (dataTable) {
			// Add loot array with items that can be obtained from this creature
			creature.loot = [];

			// Use the drops directly from the parsed loot table data
			if (dataTable.drops && Array.isArray(dataTable.drops)) {
				for (const dropInfo of dataTable.drops) {
					// Create a new loot entry matching the desired structure
					const lootItem = createLootItem(dropInfo, creature);

					// Add the loot item to the creature's loot array
					creature.loot.push(lootItem);
				}
			}

			// Sort loot by name for consistency
			if (creature.loot.length > 0) {
				creature.loot.sort((a, b) => a.name.localeCompare(b.name));
			}
		}
	}

	return creature;
}

/**
 * Creates a loot item object from drop information
 * @param {Object} dropInfo - The drop information from the data table
 * @param {Object} creature - The creature object with potential default drop quantities
 * @returns {Object} - The loot item object
 */
function createLootItem(dropInfo, creature) {
	const lootItem = {
		name: dropInfo.name,
		baseChance: dropInfo.chance,
		// Calculate effective chance if needed
		effectiveChance: dropInfo.chance
			? (
					100 -
					((100 - dropInfo.chance) * (100 - dropInfo.chance)) / 100
				).toFixed(4)
			: undefined,
		quantity: {
			min: dropInfo.minQuantity,
			max: dropInfo.maxQuantity,
		},
	};

	// Use creature's default drop quantity if the loot item's quantity is zero
	if (lootItem.quantity.min === 0 && lootItem.quantity.max === 0) {
		if (
			creature.dropQuantity &&
			creature.dropQuantity.min !== undefined &&
			creature.dropQuantity.max !== undefined
		) {
			lootItem.quantity = {
				min: creature.dropQuantity.min,
				max: creature.dropQuantity.max,
			};
		}
	}

	return lootItem;
}

module.exports = {
	processCreatureLoot,
	createLootItem,
};
