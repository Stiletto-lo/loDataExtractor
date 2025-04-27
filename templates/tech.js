/**
 * Template for tech tree entries
 */

const tech = {
	name: undefined,
	parent: undefined,
	category: undefined,
	type: undefined,
	onlyDevs: undefined,
	level: undefined, // Required level to unlock this tech
	pointsCost: undefined, // Points cost required to unlock this tech
	unlocks: undefined, // Array of items that this tech unlocks
};

Object.freeze(tech);

module.exports = tech;
