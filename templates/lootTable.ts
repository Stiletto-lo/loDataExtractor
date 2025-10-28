/**
 * Template for a LootTable that is referenced by a DataTable
 * This represents the structure of a LootTable with its properties
 */

export type LootTable = {
	name?: string; // Name of the loot table
	objectName?: string; // Original object name reference (e.g., "DataTable'BaseResources_T4'")
	objectPath?: string; // Path to the loot table (e.g., "Mist/Content/Mist/Data/LootTables/LootTables/Tier4/BaseResources_T4.0")
	runChance?: number; // Chance of this table being run (0.0 to 1.0)
	minIterations?: number; // Minimum number of iterations
	maxIterations?: number; // Maximum number of iterations
	perIterationRunChance?: number; // Chance per iteration (0.0 to 1.0)
	minQuantityMultiplier?: number; // Minimum quantity multiplier
	maxQuantityMultiplier?: number; // Maximum quantity multiplier
	drops?: any[]; // Array of items that can be dropped from this table
};
