const creature = {
	name: undefined,
	type: undefined,
	health: undefined,
	experiencie: undefined,
	lootTable: undefined,
	// Additional fields from the improved implementation
	description: undefined,
	category: undefined,
	tier: undefined,
	dropChance: undefined,
	dropQuantity: {
		min: undefined,
		max: undefined,
	},
	// Array of possible drops with their chances and quantities
	drops: undefined,
};

Object.freeze(creature);

module.exports = creature;
