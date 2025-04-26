/**
 * LootBox parser for handling strongbox loot data
 *
 * This module provides functions for parsing loot boxes (strongboxes)
 * from game data files. These contain information about what items can drop from them.
 */

const fs = require("node:fs");
const path = require("node:path");
const dataParser = require("../../dataParsers");
const translator = require("../../translator");
const lootTemplateTemplate = require("../../../templates/lootTemplate");

// Output directories
const OUTPUT_DIR = path.join(__dirname, "../../../exported");
const LOOTBOXES_DIR = path.join(OUTPUT_DIR, "loot_boxes");

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(LOOTBOXES_DIR)) {
  fs.mkdirSync(LOOTBOXES_DIR, { recursive: true });
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
 * Parse a loot box file to extract information about what items it can drop
 * @param {string} filePath - Path to the loot box file
 * @returns {Object|null} - Parsed loot box data or null if error occurs
 */
const parseLootBox = (filePath) => {
  if (!filePath || !filePath.includes("LootBoxes")) {
    return null;
  }

  const lootBoxData = readJsonFile(filePath);
  if (!lootBoxData || !Array.isArray(lootBoxData)) {
    return null;
  }

  // Find the default object with Properties
  const defaultObject = lootBoxData.find(
    (obj) => obj.Name?.startsWith("Default__") && obj.Properties?.Loot
  );

  if (!defaultObject || !defaultObject.Properties?.Loot?.Tables) {
    return null;
  }

  // Extract the loot box name from the file path
  const fileName = path.basename(filePath, ".json");
  const lootBoxName = dataParser.parseType(fileName);
  const translatedName = translator.translateName(lootBoxName) || lootBoxName;

  // Create a template for the loot box data
  const lootBox = { ...lootTemplateTemplate };
  lootBox.name = lootBoxName;
  lootBox.displayName = translatedName;
  lootBox.type = "LootBox";
  lootBox.class = defaultObject.Class || "Unknown";
  lootBox.tables = [];

  // Process each loot table reference
  for (const tableRef of defaultObject.Properties.Loot.Tables) {
    if (!tableRef?.Table?.ObjectName) {
      continue;
    }

    // Extract table name from ObjectName (e.g., "DataTable'Armors_T1'")
    const match = tableRef.Table.ObjectName.match(/DataTable'([^']+)'/);
    if (!match?.[1]) {
      continue;
    }

    const tableName = match[1];
    const tableData = {
      name: tableName,
      runChance: tableRef.RunChance || 1.0,
      minIterations: tableRef.MinIterations || 1,
      maxIterations: tableRef.MaxIterations || 1,
      perIterationRunChance: tableRef.PerIterationRunChance || 1.0,
      minQuantityMultiplier: tableRef.MinQuantityMultiplier || 1.0,
      maxQuantityMultiplier: tableRef.MaxQuantityMultiplier || 1.0,
    };

    lootBox.tables.push(tableData);
  }

  // Save the loot box data to a file
  const outputPath = path.join(LOOTBOXES_DIR, `${lootBoxName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(lootBox, null, 2));

  return lootBox;
};

module.exports = {
  parseLootBox,
};