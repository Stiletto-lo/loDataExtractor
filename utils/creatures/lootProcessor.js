/**
 * Creature Loot Processor Utility
 *
 * This module is responsible for processing loot information for creatures,
 * including drop chances, quantities, and related item information.
 */

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
