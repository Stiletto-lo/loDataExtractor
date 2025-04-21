/**
 * Template for a LootTemplate that contains multiple LootTables
 * This represents the structure of a LootTemplate with its properties
 */

const lootTemplate = {
  name: undefined, // Name of the loot template
  type: undefined, // Type of the loot template (e.g., "EasyRupu_T2_Q_C")
  class: undefined, // Class of the loot template
  super: undefined, // Super class reference
  tables: [], // Array of loot tables referenced by this template
};

Object.freeze(lootTemplate);

module.exports = lootTemplate;