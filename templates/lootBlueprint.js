/**
 * Template for a LootBlueprint that contains simplified information
 * This represents the structure of a LootBlueprint with only essential properties
 */

const lootBlueprint = {
	name: undefined, // Name of the loot blueprint (e.g., "EasyRupu_T3_C")
	tables: [], // Array of simplified loot tables with only essential information
	// Each table in the array will have the following structure:
	// {
	//   name: "BaseResources_T3", // Name of the table
	//   runChance: 1.0, // Chance of this table being run (0.0 to 1.0)
	//   minIterations: 1, // Minimum number of iterations
	//   maxIterations: 1, // Maximum number of iterations
	//   perIterationRunChance: 1.0, // Chance per iteration (0.0 to 1.0)
	//   minQuantityMultiplier: 1.0, // Minimum quantity multiplier
	//   maxQuantityMultiplier: 1.0 // Maximum quantity multiplier
	// }
};

Object.freeze(lootBlueprint);

module.exports = lootBlueprint;
