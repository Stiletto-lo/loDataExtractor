const creature = {
	name: undefined,
	type: undefined,
	health: undefined,
	experiencie: undefined,
	lootTemplate: undefined,
	category: undefined,
	tier: undefined,
	drops: undefined,
	harvestableComponents: undefined, // New field for harvestable components
};

Object.freeze(creature);

module.exports = creature;
