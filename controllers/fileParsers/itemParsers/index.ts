/**
 * Index file that exports all item parser functionality
 */

import * as generalItemParser from "./generalItemParser";
import * as schematicParser from "./schematicParser";
import * as placeableParser from "./placeableParser";
import * as techParser from "./techParser";
import * as damageParser from "./damageParser";
import * as cachedItemsParser from "./cachedItemsParser";
import * as pricesParser from "./pricesParser";
import * as itemNameGlossary from "../itemNameGlossary";

// Re-export all functionality from the individual modules
export const getItemFromItemData = generalItemParser.getItemFromItemData;
export const parseItemData = generalItemParser.parseItemData;

// Schematic related functions
export const parseSchematicItemData = schematicParser.parseSchematicItemData;

// Placeable related functions
export const parsePlaceableData = placeableParser.parsePlaceableData;

// Tech data related functions
export const parseTechData = techParser.parseTechData;

// Damage related functions
export const parseDamage = damageParser.parseDamage;

// Cached items related functions
export const parseCachedItems = cachedItemsParser.parseCachedItems;

// Prices related functions
export const parsePrices = pricesParser.parsePrices;

// Item name glossary functions
export const buildItemNameGlossary = itemNameGlossary.buildItemNameGlossary;
export const getDisplayName = itemNameGlossary.getDisplayName;
export const getGlossary = itemNameGlossary.getGlossary;
export const saveGlossary = itemNameGlossary.saveGlossary;
