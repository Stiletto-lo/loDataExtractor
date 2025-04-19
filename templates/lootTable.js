/**
 * Template for a LootTable that is referenced by a DataTable
 * This represents the structure of a LootTable with its properties
 */

const lootTable = {
  name: undefined,           // Name of the loot table
  objectName: undefined,     // Original object name reference (e.g., "DataTable'BaseResources_T4'")
  objectPath: undefined,     // Path to the loot table (e.g., "Mist/Content/Mist/Data/LootTables/LootTables/Tier4/BaseResources_T4.0")
  runChance: undefined,      // Chance of this table being run (0.0 to 1.0)
  minIterations: undefined,  // Minimum number of iterations
  maxIterations: undefined,  // Maximum number of iterations
  perIterationRunChance: undefined, // Chance per iteration (0.0 to 1.0)
  minQuantityMultiplier: undefined, // Minimum quantity multiplier
  maxQuantityMultiplier: undefined, // Maximum quantity multiplier
  drops: [],                // Array of items that can be dropped from this table
};

Object.freeze(lootTable);

module.exports = lootTable;