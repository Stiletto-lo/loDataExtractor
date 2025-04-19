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
  if (creature.lootTable && dataTables[creature.lootTable]) {
    const dataTable = dataTables[creature.lootTable];

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
    effectiveChance: dropInfo.chance ?
      (100 - (100 - dropInfo.chance) * (100 - dropInfo.chance) / 100).toFixed(4) :
      undefined,
    quantity: {
      min: dropInfo.minQuantity,
      max: dropInfo.maxQuantity
    }
  };

  // Use creature's default drop quantity if the loot item's quantity is zero
  if (lootItem.quantity.min === 0 && lootItem.quantity.max === 0) {
    if (creature.dropQuantity &&
      creature.dropQuantity.min !== undefined &&
      creature.dropQuantity.max !== undefined) {
      lootItem.quantity = {
        min: creature.dropQuantity.min,
        max: creature.dropQuantity.max
      };
    }
  }

  return lootItem;
}

module.exports = {
  processCreatureLoot,
  createLootItem
};