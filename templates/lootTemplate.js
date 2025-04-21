/**
 * Template for a LootTemplate that contains simplified information
 * This represents the structure of a LootTemplate with only essential properties
 */

const lootTemplate = {
  name: undefined, // Name of the loot template (e.g., "EasyRupu_T3_C")
  // Solo mantenemos información básica para identificación
  type: undefined, // Type of the loot template
  class: undefined, // Class of the loot template
  super: undefined, // Super class reference
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

Object.freeze(lootTemplate);

module.exports = lootTemplate;