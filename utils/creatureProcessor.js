/**
 * Creature Processor Utility
 *
 *
 * This file serves as a compatibility layer for existing code that imports from
 * this location. It re-exports the functionality from the new modular structure.
 */

// Re-export from the new modular structure
const {
	processCreatures,
	exportIndividualCreatureFiles,
} = require("./creatures");

module.exports = {
	processCreatures,
	exportIndividualCreatureFiles,
};
