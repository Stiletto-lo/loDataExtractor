/**
 * LootTable parser for handling loot table data
 *
 * This module provides functions for parsing loot tables
 * from game data files.
 */

const fs = require("node:fs");
const path = require("node:path");
const dataParser = require("../../dataParsers");
const translator = require("../../translator");
const dataTableTemplate = require("../../../templates/datatable");
const lootTableTemplate = require("../../../templates/lootTable");
const dropDataTemplate = require("../../../templates/dropData");
const utilityFunctions = require("../utilityFunctions");

// Output directories
const OUTPUT_DIR = path.join(__dirname, "../../../exported");
const LOOTTABLES_DIR = path.join(OUTPUT_DIR, "loot_tables");

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(LOOTTABLES_DIR)) {
  fs.mkdirSync(LOOTTABLES_DIR, { recursive: true });
}

/**
 * Safely reads and parses a JSON file
 * @param {string} filePath - The file path to read
 * @returns {Object|null} - Parsed JSON data or null if error occurs
 */
const readJsonFile = (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    console.error("Invalid file path provided to readJsonFile");
    return null;
  }

  try {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading or parsing file ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Creates a drop item with optional properties based on configuration
 * @param {string} name - The name of the drop item
 * @param {Object} lootItemData - The loot item data containing properties
 * @returns {Object} - A configured drop item
 */
const createDropItem = (name, lootItemData) => {
  if (!name || !lootItemData) {
    return undefined;
  }

  const drop = { ...dropDataTemplate };
  drop.name = name;

  if (lootItemData.Chance) {
    drop.chance = lootItemData.Chance;
  }
  if (lootItemData.MinQuantity) {
    drop.minQuantity = lootItemData.MinQuantity;
  }
  if (lootItemData.MaxQuantity) {
    drop.maxQuantity = lootItemData.MaxQuantity;
  }

  return drop;
};

/**
 * Determines the item name based on available data
 * @param {string} baseName - The base name from translation
 * @param {Object} lootItem - The loot item data
 * @returns {string} - The resolved item name
 */
const resolveItemName = (baseName, lootItem) => {
  if (!baseName || !lootItem) {
    return "Unknown Item";
  }

  if (!lootItem?.Item?.AssetPathName) {
    return baseName;
  }

  const completeItem = utilityFunctions.getItemByType(
    dataParser.parseType(lootItem.Item.AssetPathName),
  );

  if (completeItem?.name) {
    return completeItem.name;
  }

  if (lootItem.Item.AssetPathName.includes("Schematics")) {
    return `${baseName} Schematic`;
  }

  return baseName;
};

/**
 * Validates loot table entry data
 * @param {Object} currentItem - The current loot item to validate
 * @param {string} key - The key of the current item
 * @returns {Object} - Object containing validation result and error message
 */
const validateLootTableEntry = (currentItem, key) => {
  if (!currentItem.Item) {
    return { isValid: false, error: `Missing Item property for ${key}` };
  }

  const baseName = dataParser.parseName(translator, key);
  if (!baseName) {
    return { isValid: false, error: `Could not parse name for ${key}` };
  }

  return { isValid: true, baseName };
};

/**
 * Parse loot table data from a file
 * @param {string} filePath - The file path to parse
 * @returns {boolean} - Whether parsing was successful
 */
const parseLootTable = (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    console.error("Invalid file path provided to parseLootTable");
    return false;
  }

  const jsonData = readJsonFile(filePath);
  if (!jsonData) return false;

  const firstEntry = jsonData[0];
  if (
    !firstEntry?.Name ||
    !firstEntry?.Rows ||
    firstEntry?.Type !== "DataTable"
  ) {
    return false;
  }

  const dataTable = { ...dataTableTemplate };
  dataTable.name = dataParser.parseName(translator, firstEntry.Name);
  dataTable.objectName = firstEntry.Name;
  dataTable.objectPath = firstEntry.ObjectPath || "";
  const lootItems = firstEntry.Rows;
  const tableItems = [];

  // Create a loot table for this data table
  const lootTable = { ...lootTableTemplate };
  lootTable.name = dataTable.name;
  lootTable.objectName = firstEntry.Name;
  lootTable.objectPath = firstEntry.ObjectPath || "";

  // Store loot table information for creature processing
  const lootTables = utilityFunctions.getAllLootTables
    ? utilityFunctions.getAllLootTables()
    : {};
  lootTables[firstEntry.Name] = {
    name: dataTable.name,
    drops: [],
  };

  for (const key of Object.keys(lootItems)) {
    const currentItem = lootItems[key];
    const validation = validateLootTableEntry(currentItem, key);

    if (!validation.isValid) {
      console.warn(validation.error);
      continue;
    }

    const resolvedName = resolveItemName(validation.baseName, currentItem);
    // Check if this item already exists in the tables array
    const hasDrop = tableItems.some((d) => d.name === resolvedName);

    if (!hasDrop && resolvedName !== dataTable.name) {
      const drop = createDropItem(resolvedName, currentItem);

      const itemName = translator.translateName(resolvedName);

      if (!drop) {
        continue;
      }

      tableItems.push(drop);

      // Add to the loot table drops array
      lootTable.drops.push(drop);

      // Add to the loot tables collection for creature processing
      lootTables[firstEntry.Name].drops.push({
        name: itemName,
        chance: drop.chance,
        minQuantity: drop.minQuantity,
        maxQuantity: drop.maxQuantity,
      });
    }
  }

  // Save the loot table to file
  const fileName = dataTable.name.replace(/\s+/g, "_").toLowerCase();
  const outputFilePath = path.join(LOOTTABLES_DIR, `${fileName}.json`);
  fs.writeFileSync(outputFilePath, JSON.stringify(lootTable, null, 2));

  // Update the loot tables collection
  utilityFunctions.setLootTables(lootTables);

  return true;
};

/**
 * Parse loot sites from creature data
 * @param {string} filePath - The file path to parse
 * @returns {boolean} - Whether parsing was successful
 */
const parseLootSites = (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    console.error("Invalid file path provided to parseLootSites");
    return false;
  }

  const jsonData = readJsonFile(filePath);
  if (!jsonData || !Array.isArray(jsonData) || jsonData.length < 2) {
    return false;
  }

  const classInfo = jsonData[0];
  const creatureData = jsonData[1];

  if (!classInfo?.Name || !creatureData?.Properties?.LootTable) {
    return false;
  }

  const creatureName = getLootSiteNameFromObject(classInfo.Name);
  if (!creatureName) {
    return false;
  }

  // Get the loot table reference
  const lootTableRef = creatureData.Properties.LootTable.ObjectName;
  if (!lootTableRef) {
    return false;
  }

  // Extract the loot table name from the reference
  const match = lootTableRef.match(/DataTable'([^']+)'/);
  if (!match?.[1]) {
    return false;
  }

  const lootTableName = match[1];
  const lootTables = utilityFunctions.getAllLootTables();
  const lootTable = lootTables[lootTableName];

  if (!lootTable) {
    return false;
  }

  // Create or update the creature entry
  const creatures = utilityFunctions.getCreatures();
  let creature = creatures[creatureName];

  if (!creature) {
    creature = { ...creatureTemplate };
    creature.name = creatureName;
    creature.lootTemplates = [];
    creatures[creatureName] = creature;
  }

  // Add the loot table to the creature if not already present
  const hasLootTable = creature.lootTemplates.some(
    (lt) => lt.name === lootTable.name
  );

  if (!hasLootTable) {
    creature.lootTemplates.push({
      name: lootTable.name,
      drops: lootTable.drops,
    });
  }

  // Update the creatures collection
  utilityFunctions.setCreatures(creatures);

  return true;
};

/**
 * Extracts a creature name from an object name
 * @param {string} objectName - The object name to parse
 * @returns {string|null} - The extracted creature name or null if not found
 */
const getLootSiteNameFromObject = (objectName) => {
  if (!objectName) {
    return null;
  }

  // Extract the creature name from the object name
  const match = objectName.match(/BP_([^_]+)/);
  if (!match?.[1]) {
    return null;
  }

  return match[1];
};

module.exports = {
  parseLootTable,
  parseLootSites,
  getLootSiteNameFromObject,
};