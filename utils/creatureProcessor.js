/**
 * Creature Processor Utility
 *
 * This module enhances creature data processing by adding more detailed information
 * to creature exports, including descriptions, spawn locations, behavior patterns,
 * attacks, resistances, weaknesses, and drop information.
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
