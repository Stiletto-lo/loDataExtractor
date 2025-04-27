/**
 * Index file for loot parsers
 *
 * This module exports all loot-related parser functions
 */

const lootTableParser = require('./lootTableParser');
const lootTemplateParser = require('./lootTemplateParser');

module.exports = {
  parseLootTable: lootTableParser.parseLootTable,
  parseLootTemplate: lootTemplateParser.parseLootTemplate,
};