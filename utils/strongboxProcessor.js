/**
 * Strongbox Processor Utility
 *
 * This file serves as an integration layer for strongbox processing functionality.
 * It re-exports the functionality from the modular structure in the strongboxes directory.
 */

const dropProcessor = require("./strongboxes/dropProcessor");
const fileParser = require("../controllers/fileParsers");

/**
 * Process all strongbox items to add drop information
 * @param {Array} items - The items to process (optional)
 * @returns {Array} - All items with strongbox drop information added
 */
const processStrongboxDrops = (items) => {
  const itemsToProcess = items || fileParser.getAllItems();
  const lootTemplates = fileParser.getAllLootTemplates();
  const lootTables = fileParser.getAllLootTables();

  return dropProcessor.addDropInformation(itemsToProcess, lootTemplates, lootTables);
};

module.exports = {
  processStrongboxDrops,
};