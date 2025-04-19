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
	equipment: undefined,
	dropChance: undefined,
	dropQuantity: {
		min: undefined,
		max: undefined
	},
	spawnLocations: undefined,
	behavior: undefined,
	attacks: undefined,
	resistances: undefined,
	weaknesses: undefined
};

Object.freeze(creature);

module.exports = creature;
