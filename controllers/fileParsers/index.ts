/**
 * Index file that exports all file parser functionality
 */

import * as itemParsers from "./itemParsers";
import * as lootParsers from "./lootParsers";
import * as translationParsers from "./translationParsers";
import * as upgradeParsers from "./upgradeParsers";
import * as vehicleParser from "./vehicleParser";
import * as perkParsers from "./perkParsers";
import * as utilityFunctions from "./utilityFunctions";
import * as translator from "../translator";
import * as itemNameGlossary from "./itemNameGlossary";

// Re-export all functionality from the individual modules
export const parseVehicleData = vehicleParser.parseVehicleData;
export const processVehicleFiles = vehicleParser.processVehicleFiles;

// Item related functions
export const getItemFromItemData = itemParsers.getItemFromItemData;
export const parseItemData = itemParsers.parseItemData;
export const parseSchematicItemData = itemParsers.parseSchematicItemData;
export const parsePlaceableData = itemParsers.parsePlaceableData;
export const parseTechData = itemParsers.parseTechData;
export const parseDamage = itemParsers.parseDamage;
export const parsePrices = itemParsers.parsePrices;
export const parseCachedItems = itemParsers.parseCachedItems;

// Loot related functions
export const parseLootTable = lootParsers.parseLootTable;
export const parseLootSites = lootParsers.parseLootSites;
export const getLootSiteNameFromObject = lootParsers.getLootSiteNameFromObject;
export const parseLootTemplate = lootParsers.parseLootTemplate;
export const getAllLootTables = utilityFunctions.getAllLootTables;
export const setLootTables = utilityFunctions.setLootTables;
export const getAllLootTemplates = utilityFunctions.getAllLootTemplates;
export const setLootTemplates = utilityFunctions.setLootTemplates;

// Translation related functions
export const parseTranslations = translationParsers.parseTranslations;
export const parseOtherTranslations = translationParsers.parseOtherTranslations;
export const parseStringTables = translationParsers.parseStringTables;

// Upgrade related functions
export const parseUpgrades = upgradeParsers.parseUpgrades;
export const parseUpgradesToItems = upgradeParsers.parseUpgradesToItems;

// Perk related functions
export const parsePerkData = perkParsers.parsePerkData;
export const getAllPerks = utilityFunctions.getAllPerks;
export const getPerkByName = utilityFunctions.getPerkByName;
export const setPerks = utilityFunctions.setPerks;
export const addPerk = utilityFunctions.addPerk;

// Utility functions
export const getItem = utilityFunctions.getItem;
export const getItemByType = utilityFunctions.getItemByType;
export const extractItemByType = utilityFunctions.extractItemByType;
export const getIngredientsFromItem = utilityFunctions.getIngredientsFromItem;
export const getAllItems = utilityFunctions.getAllItems;
export const getTechData = utilityFunctions.getTechData;
export const setTechData = utilityFunctions.setTechData;
export const extractTechByType = utilityFunctions.extractTechByType;
export const getUpgradesData = utilityFunctions.getUpgradesData;
export const getCreatures = utilityFunctions.getCreatures;
export const setAllItems = utilityFunctions.setAllItems;
export const setUpgradesData = utilityFunctions.setUpgradesData;
export const setCreatures = utilityFunctions.setCreatures;

// Translator
export const getTranslator = () => translator;

// Item name glossary functions
export const buildItemNameGlossary = itemNameGlossary.buildItemNameGlossary;
export const getDisplayName = itemNameGlossary.getDisplayName;
export const getGlossary = itemNameGlossary.getGlossary;
export const saveGlossary = itemNameGlossary.saveGlossary;
