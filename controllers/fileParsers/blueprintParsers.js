/**
 * Blueprint parsers for handling blueprint-related data
 */

const fs = require("node:fs");
const dataParser = require("../dataParsers");
const translator = require("../translator");
const blueprintTemplate = require("../../templates/lootBlueprint");
const dropTemplate = require("../../templates/drop");

// Import utility functions
const utilityFunctions = require("./utilityFunctions");

/**
 * Parse location data from a blueprint
 * @param {Object} blueprint - The blueprint object
 * @param {string} location - The location name
 */
const parseLocation = (blueprint, location) => {
	const EXTRACT_ALL_DATA = process.env.EXTRACT_ALL_DATA === "true";

	for (const dataTable of blueprint.tables) {
		let dataTableChance = 100;
		let maxIterations = 1;
		if (dataTable.maxIterations) {
			maxIterations = dataTable.minIterations;
		}
		if (dataTable.dataTableChance) {
			dataTableChance = dataTable.dataTableChance;
		}

		const maxChance = (dataTableChance * maxIterations) / 100;

		// Access the drops array from the lootTable in the dataTable's tables array
		// Find the lootTable in the dataTable's tables array
		const lootTable = dataTable.tables.find(
			(table) => table.drops && Array.isArray(table.drops),
		);

		if (!lootTable?.drops) {
			console.warn(`No drops found in lootTable for ${dataTable.name}`);
			return;
		}

		for (const lootItemData of lootTable.drops) {
			const item = utilityFunctions.getItem(
				dataParser.parseName(translator, lootItemData.name),
			);
			if (item?.name) {
				const itemDrops = item.drops ? item.drops : [];
				const hasDrop = itemDrops.some((d) => d.location === location);
				if (!hasDrop && item.name !== location) {
					const drop = { ...dropTemplate };
					drop.location = location;
					if (EXTRACT_ALL_DATA && lootItemData.chance) {
						drop.chance = lootItemData.chance;
					}
					if (EXTRACT_ALL_DATA && lootItemData.minQuantity) {
						drop.minQuantity = lootItemData.minQuantity;
					}
					if (EXTRACT_ALL_DATA && lootItemData.maxQuantity) {
						drop.maxQuantity = lootItemData.maxQuantity;
					}
					if (drop.chance) {
						drop.chance = (drop.chance * maxChance) / 100;
					}
					itemDrops.push(drop);
					item.drops = itemDrops;
				}
				utilityFunctions.getAllItems().push(item);
			}
		}
	}
};

/**
 * Parse blueprints to items
 */
const parseBlueprintsToItems = () => {
	const allBlueprints = utilityFunctions.getAllBlueprints();
	const creatures = utilityFunctions.getCreatures();
	const lootTables = utilityFunctions.getAllLootTables();

	for (const blueprint of allBlueprints) {
		const locations = creatures.filter((c) => c.lootTable === blueprint.name);
		if (locations.length > 0) {
			for (const location of locations) {
				parseLocation(blueprint, location.name);
			}
		} else {
			const location = translator.translateLootSite(blueprint.name);
			parseLocation(blueprint, location);
		}
	}

	for (const lootTableName in lootTables) {
		const lootTable = lootTables[lootTableName];
		if (lootTable?.drops && Array.isArray(lootTable.drops)) {
			const location = lootTable.name;

			for (const lootItemData of lootTable.drops) {
				const item = utilityFunctions.getItem(lootItemData.name);
				if (item?.name) {
					const itemDrops = item.drops ? item.drops : [];
					const hasDrop = itemDrops.some((d) => d.location === location);
					if (!hasDrop && item.name !== location) {
						const drop = { ...dropTemplate };
						drop.location = location;
						if (lootItemData.chance) {
							drop.chance = lootItemData.chance;
						}
						if (lootItemData.minQuantity) {
							drop.minQuantity = lootItemData.minQuantity;
						}
						if (lootItemData.maxQuantity) {
							drop.maxQuantity = lootItemData.maxQuantity;
						}
						itemDrops.push(drop);
						item.drops = itemDrops;
						utilityFunctions.getAllItems().push(item);
					}
				}
			}
		}
	}
};

/**
 * Parse loot blueprint data from a file
 * @param {string} filePath - The file path to parse
 */
const parseLootBlueprint = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (jsonData[0].Name && jsonData?.[0]?.Type === "BlueprintGeneratedClass") {
		if (jsonData[1]?.Type) {
			const blueprint = { ...blueprintTemplate };
			blueprint.name = dataParser.parseName(translator, jsonData[1].Type);
			if (jsonData[1]?.Properties?.Loot?.Tables) {
				const allBlueprintTables = [];
				const tables = jsonData[1].Properties.Loot.Tables;

				for (const table of tables) {
					if (table?.Table?.ObjectPath) {
						const name = dataParser.parseName(
							translator,
							table.Table.ObjectName,
						);
						const dataTable = utilityFunctions
							.getAllDatatables()
							.find((data) => data.name === name);
						if (dataTable) {
							dataTable.chance = table.RunChance ? table.RunChance : undefined;
							dataTable.minIterations = table.MinIterations
								? table.MinIterations
								: undefined;
							dataTable.maxIterations = table.MaxIterations
								? table.MaxIterations
								: undefined;
							dataTable.iterationRunChance = table.PerIterationRunChance
								? table.PerIterationRunChance
								: undefined;
							dataTable.minQuantityMultiplier = table.MinQuantityMultiplier
								? table.MinQuantityMultiplier
								: undefined;
							dataTable.maxQuantityMultiplier = table.MaxQuantityMultiplier
								? table.MaxQuantityMultiplier
								: undefined;
							dataTable.onlyOne = table.bGiveItemOnlyOnce
								? table.bGiveItemOnlyOnce
								: undefined;

							allBlueprintTables.push(dataTable);
						}
					}
				}
				blueprint.tables = allBlueprintTables;
				utilityFunctions.getAllBlueprints().push(blueprint);
			}
		}
	}
};

module.exports = {
	parseLocation,
	parseBlueprintsToItems,
	parseLootBlueprint,
};
