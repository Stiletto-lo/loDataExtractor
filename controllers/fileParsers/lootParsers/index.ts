/**
 * Index file for loot parsers
 *
 * This module exports all loot-related parser functions
 */

import * as lootTableParser from './lootTableParser';
import * as lootTemplateParser from './lootTemplateParser';

export const parseLootTable = lootTableParser.parseLootTable;
export const parseLootTemplate = lootTemplateParser.parseLootTemplate;
export const parseLootSites = lootTableParser.parseLootSites;
export const getLootSiteNameFromObject = lootTableParser.getLootSiteNameFromObject;