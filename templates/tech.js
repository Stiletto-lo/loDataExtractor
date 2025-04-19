/**
 * Template for tech tree entries
 */

const tech = {
  name: undefined,
  parent: undefined,
  cost: undefined,
  category: undefined,
  type: undefined,
  onlyDevs: undefined,
  unlocks: undefined  // Array of items that this tech unlocks
};

Object.freeze(tech);

module.exports = tech;