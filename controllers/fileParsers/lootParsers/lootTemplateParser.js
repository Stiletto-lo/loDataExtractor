/**
 * LootTemplate parser for handling loot template data
 *
 * This module provides functions for parsing loot templates
 * from game data files. LootTemplates contain multiple LootTables.
 */

const fs = require("node:fs");
const path = require("node:path");
const lootTemplateTemplate = require("../../../templates/lootTemplate");

// Output directories
const OUTPUT_DIR = path.join(__dirname, "../../../exported");
const LOOTTEMPLATES_DIR = path.join(OUTPUT_DIR, "loot_templates");
const LOOTTEMPLATES_TIER_DIRS = {
  T1: path.join(LOOTTEMPLATES_DIR, "tier1"),
  T2: path.join(LOOTTEMPLATES_DIR, "tier2"),
  T3: path.join(LOOTTEMPLATES_DIR, "tier3"),
  T4: path.join(LOOTTEMPLATES_DIR, "tier4"),
};

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(LOOTTEMPLATES_DIR)) {
  fs.mkdirSync(LOOTTEMPLATES_DIR, { recursive: true });
}

// Create tier directories
for (const dir of Object.values(LOOTTEMPLATES_TIER_DIRS)) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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
 * Extracts tier information from a file path or type name
 * @param {string} pathOrType - The file path or type name
 * @returns {string|null} - The tier (T1, T2, T3, T4) or null if not found
 */
const extractTier = (pathOrType) => {
  if (!pathOrType) {
    return null;
  }

  if (pathOrType.includes("T1_") || pathOrType.includes("Tier1")) {
    return "T1";
  }
  if (pathOrType.includes("T2_") || pathOrType.includes("Tier2")) {
    return "T2";
  }
  if (pathOrType.includes("T3_") || pathOrType.includes("Tier3")) {
    return "T3";
  }
  if (pathOrType.includes("T4_") || pathOrType.includes("Tier4")) {
    return "T4";
  }

  return null;
};

/**
 * Parse a loot table reference from the Properties.Loot.Tables array
 * @param {Object} tableRef - The table reference object
 * @returns {Object} - Parsed loot table object with only essential information
 */
const parseLootTableRef = (tableRef) => {
  if (!tableRef?.Table) {
    return null;
  }

  const simplifiedTable = {};

  // Extract table reference information
  if (tableRef.Table.ObjectName) {
    // Extract the name from the ObjectName (e.g., "DataTable'BaseResources_T2'" or "DataTable'Armors_T1'")
    const match = tableRef.Table.ObjectName.match(/(?:DataTable|Object)'([^']+)'/);
    if (match?.[1]) {
      simplifiedTable.name = match[1];
    }
  } else if (tableRef.Table.ObjectPath) {
    // For LootBox templates, the table reference might be in ObjectPath instead
    const pathParts = tableRef.Table.ObjectPath.split('/');
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      // Extract the name from the last part of the path
      const nameParts = lastPart.split('.');
      simplifiedTable.name = nameParts[0];
    }
  }

  // Add only essential table properties
  simplifiedTable.runChance =
    tableRef.RunChance !== undefined ? tableRef.RunChance : 1.0;
  simplifiedTable.minIterations =
    tableRef.MinIterations !== undefined ? tableRef.MinIterations : 1;
  simplifiedTable.maxIterations =
    tableRef.MaxIterations !== undefined ? tableRef.MaxIterations : 1;
  simplifiedTable.perIterationRunChance =
    tableRef.PerIterationRunChance !== undefined
      ? tableRef.PerIterationRunChance
      : 1.0;
  simplifiedTable.minQuantityMultiplier =
    tableRef.MinQuantityMultiplier !== undefined
      ? tableRef.MinQuantityMultiplier
      : 1.0;
  simplifiedTable.maxQuantityMultiplier =
    tableRef.MaxQuantityMultiplier !== undefined
      ? tableRef.MaxQuantityMultiplier
      : 1.0;

  return simplifiedTable;
};

/**
 * @param {string} tableName
 * @returns {string|null}
 */
const extractTableTier = (tableName) => {
  if (!tableName) {
    return null;
  }

  if (tableName.includes("_T1")) {
    return "T1";
  }
  if (tableName.includes("_T2")) {
    return "T2";
  }
  if (tableName.includes("_T3")) {
    return "T3";
  }
  if (tableName.includes("_T4")) {
    return "T4";
  }

  return null;
};

/**
 * Parse loot template data from a file
 * @param {string} filePath - The file path to parse
 * @returns {boolean} - Whether parsing was successful
 */
const parseLootTemplate = (filePath) => {
  if (!filePath || typeof filePath !== "string") {
    console.error("Invalid file path provided to parseLootTemplate");
    return false;
  }

  const jsonData = readJsonFile(filePath);
  if (!jsonData || !Array.isArray(jsonData) || jsonData.length < 2) {
    console.error(`Invalid or incomplete data in ${filePath}`);
    return false;
  }

  // The first object contains class information
  const classInfo = jsonData[0];
  // The second object contains the actual template data
  const templateData = jsonData[1];

  if (
    !classInfo ||
    !templateData?.Properties?.Loot
  ) {
    console.error(`Missing required properties in ${filePath}`);
    return false;
  }

  // Create a new loot template
  const lootTemplate = { ...lootTemplateTemplate };

  lootTemplate.name = classInfo.Name || "Unknown";
  lootTemplate.type = templateData.Type || "Unknown";
  lootTemplate.class = templateData.Class || "Unknown";

  if (classInfo?.Super?.ObjectName) {
    lootTemplate.super = classInfo.Super.ObjectName;
  }

  // Determine the tier for proper directory placement and table filtering
  const tier =
    extractTier(filePath) ||
    extractTier(lootTemplate.name) ||
    extractTier(lootTemplate.type) ||
    "T1";

  // Process loot tables
  // Handle both standard loot templates and LootBox templates which have bUseTables property
  if (templateData.Properties.Loot) {
    const allParsedTables = [];

    // Check if this is a LootBox template with bUseTables property
    if (templateData.Properties.Loot.bUseTables &&
      templateData.Properties.Loot.Tables &&
      Array.isArray(templateData.Properties.Loot.Tables)) {

      console.log(`Processing LootBox template: ${lootTemplate.name}`);

      for (const tableRef of templateData.Properties.Loot.Tables) {
        const parsedTable = parseLootTableRef(tableRef);
        if (parsedTable) {
          allParsedTables.push(parsedTable);
        }
      }
    }
    // Standard loot template format
    else if (templateData.Properties.Loot.Tables &&
      Array.isArray(templateData.Properties.Loot.Tables)) {

      for (const tableRef of templateData.Properties.Loot.Tables) {
        const parsedTable = parseLootTableRef(tableRef);
        if (parsedTable) {
          allParsedTables.push(parsedTable);
        }
      }
    }

    lootTemplate.tables = allParsedTables;
  }

  // Create the output directory if it doesn't exist
  const outputDir = LOOTTEMPLATES_TIER_DIRS[tier] || LOOTTEMPLATES_DIR;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate filename from the template name
  const fileName = lootTemplate.name.replace(/\s+/g, "_").toLowerCase();
  const outputFilePath = path.join(outputDir, `${fileName}.json`);

  // Write the loot template to file
  fs.writeFileSync(outputFilePath, JSON.stringify(lootTemplate, null, 2));

  // Add the loot template to the DataStore
  const utilityFunctions = require("../utilityFunctions");
  const lootTemplates = utilityFunctions.getAllLootTemplates();
  lootTemplates.push(lootTemplate);
  utilityFunctions.setLootTemplates(lootTemplates);

  return true;
};

module.exports = {
  parseLootTemplate,
};