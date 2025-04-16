/**
 * Last Oasis Data Extractor
 * 
 * This script extracts and processes game data from Last Oasis game files,
 * transforming them into structured JSON files for external use.
 */

require("dotenv").config();
const fs = require("fs-extra");
const path = require("node:path");
const fileParser = require("../controllers/fileParsers");

// Configuration constants
const CONFIG = {
  SHOW_DEV_ITEMS: process.env.SHOW_DEV_ITEMS === "true",
  CONTENT_FOLDER_PATH: process.env.CONTENT_FOLDER_PATH || "./",
  EXTRACT_LOOT_TABLES: process.env.EXTRACT_LOOT_TABLES === "true",
  TRANSLATE_FILES: process.env.TRANSLATE_FILES === "true",
  EXPORT_FOLDER: "./exported/"
};

// Data collections
let allItems = [];

/**
 * Main execution function
 */
async function main() {
  loadFiles();
  await saveFiles();
  console.log("Data extraction complete!");
}

/**
 * Loads all game data files
 */
function loadFiles() {
  console.info("Loading StringTables");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/StringTables`, "stringtables");

  console.info("Loading Localization");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Localization/Game/en`, "translation");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Localization/Game`, "translationOthers");

  console.info("Loading Loot sites");
  const creatureFolders = [
    "Monkey",
    "Okkam",
    "Papak"
  ];

  for (const folder of creatureFolders) {
    loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Characters/Creatures/${folder}`, "lootsites");
  }

  console.info("Loading TechTree");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/TechTree`, "tech");

  console.info("Loading Items");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/Items`, "item");

  console.info("Loading Placeables");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/Placeables`, "placeables");

  console.info("Loading Recipes");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/TechTree`, "item");

  console.info("Loading Trade");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/Trade`, "trade");

  console.info("Loading Placeables Cached");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/Placeables`, "item");

  console.info("Loading Walkers Upgrades");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/Walkers`, "upgrages");

  console.info("Loading Damages");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/DamageTypes`, "damagetypes");

  console.info("Loading Schematics");
  loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/Items/Schematics`, "schematics");

  console.info("Building Item Name Glossary");
  fileParser.buildItemNameGlossary(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/Items`);

  if (CONFIG.EXTRACT_LOOT_TABLES) {
    console.info("Loading LootTables");
    loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/LootTables`, "loottables");
    loadDirData(`${CONFIG.CONTENT_FOLDER_PATH}Content/Mist/Data/LootTables`, "blueprintsloot");
    fileParser.parseBlueprintsToItems();
  }
}

/**
 * Processes and saves all extracted data to files
 */
async function saveFiles() {
  console.info("Parse Upgrades to Items");
  fileParser.parseUpgradesToItems();

  allItems = fileParser.getAllItems();
  const translator = fileParser.getTranslator();

  // Filter out dev-only items if configured
  if (!CONFIG.SHOW_DEV_ITEMS) {
    allItems = allItems.filter((item) => !item.onlyDevs);
  }

  // Translate items
  console.info("Translating the items");
  allItems = translator.addDescriptions(allItems);
  allItems = translator.translateItems(allItems);

  // Clean up item data
  cleanupItemData(allItems);

  // Process and deduplicate items
  allItems = deduplicateItems(allItems);

  // Process tech data
  await processTechData();

  // Sort and save items
  allItems.sort(orderByName);
  await saveItemData();

  // Process and save creature data
  await processCreatureData();

  // Process and save translation data if enabled
  if (CONFIG.TRANSLATE_FILES) {
    await processTranslationData(translator);
  }
}

/**
 * Cleans up undefined properties in items
 * @param {Array} items - Array of items to clean
 */
function cleanupItemData(items) {
  for (const item of items) {
    for (const key of Object.keys(item)) {
      if (item[key] === undefined) {
        delete item[key];
      }
    }

    if (item?.drops !== undefined && item.drops.length <= 0) {
      item.drops = undefined;
    }

    if (item?.toolInfo !== undefined && item.toolInfo.length <= 0) {
      item.toolInfo = undefined;
    }
  }
}

/**
 * Deduplicates items by merging items with the same name
 * @param {Array} items - Array of items to deduplicate
 * @returns {Array} - Deduplicated array of items
 */
function deduplicateItems(items) {
  return items
    .map((item) => {
      const countItems = items.filter((item2) => item.name === item2.name);
      if (countItems.length > 1) {
        return { ...countItems[0], ...countItems[1] };
      }
      return item;
    })
    .filter((item) => item.name && Object.keys(item).length > 2)
    .filter((item) => !item.name.includes("Packing"))
    .reduce((acc, current) => {
      const x = acc.find((item) => item.name === current.name);
      if (!x) {
        return acc.concat([current]);
      }
      return acc;
    }, []);
}

/**
 * Processes and saves tech data
 */
async function processTechData() {
  let techData = fileParser.getTechData();

  // Process tech data similar to items
  techData = techData
    .map((tech) => {
      const countTech = techData.filter((tech2) => tech.name === tech2.name);
      if (countTech.length > 1) {
        return { ...countTech[0], ...countTech[1] };
      }
      return tech;
    })
    .filter((tech) => tech.name && Object.keys(tech).length > 2)
    .reduce((acc, current) => {
      const x = acc.find((tech) => tech.name === current.name);
      if (!x) {
        return acc.concat([current]);
      }
      return acc;
    }, []);

  // Sort tech data by name
  techData.sort(orderByName);

  if (techData.length > 0) {
    await saveTechData(techData);
  }
}

/**
 * Saves tech data to files
 * @param {Array} techData - Tech data to save
 */
async function saveTechData(techData) {
  await fs.writeFile(
    `${CONFIG.EXPORT_FOLDER}tech.json`,
    JSON.stringify(techData, null, 2),
    (err) => {
      if (err) {
        console.error("Error creating the tech.json file");
      } else {
        console.log("Tech data exported to tech.json");
      }
    }
  );

  await fs.writeFile(
    `${CONFIG.EXPORT_FOLDER}tech_min.json`,
    JSON.stringify(techData),
    (err) => {
      if (err) {
        console.error("Error creating the tech_min.json file");
      } else {
        console.log("Tech_min.json exported");
      }
    }
  );
}

/**
 * Saves item data to files
 */
async function saveItemData() {
  if (allItems.length > 0) {
    await fs.writeFile(
      `${CONFIG.EXPORT_FOLDER}items.json`,
      JSON.stringify(allItems, null, 2),
      (err) => {
        if (err) {
          console.error("Error creating the file");
        } else {
          console.log("Items exported");

          // Run the tech tree item unifier to fix inconsistencies
          const { unifyTechTreeAndItems } = require('../utils/techTreeItemUnifier');
          console.log("Running tech tree item unifier...");
          const unifyResult = unifyTechTreeAndItems(`${CONFIG.EXPORT_FOLDER}items.json`);
          if (unifyResult.success) {
            console.log(`Tech tree unification complete. Fixed ${unifyResult.fixedCount} learn entries.`);
          } else {
            console.error(`Tech tree unification failed: ${unifyResult.error}`);
          }

          // Reload the items after unification
          allItems = JSON.parse(fs.readFileSync(`${CONFIG.EXPORT_FOLDER}items.json`, 'utf8'));
        }
      }
    );

    // Save the item name glossary
    fileParser.saveGlossary(`${CONFIG.EXPORT_FOLDER}itemNameGlossary.json`);

    // Clean up items for minimal export
    cleanupItemsForMinExport();

    // Create and save minimal items data
    await saveMinimalItemData();

    // Create individual item files
    await saveIndividualItemFiles();
  }
}

/**
 * Cleans up items for minimal export
 */
function cleanupItemsForMinExport() {
  for (const item of allItems) {
    for (const key of Object.keys(item)) {
      if (item[key] === undefined) {
        delete item[key];
      }
    }

    // Remove unnecessary fields for minimal export
    const fieldsToRemove = ['translation', 'type', 'schematicName', 'damageType'];
    for (const field of fieldsToRemove) {
      if (item?.[field] !== undefined) {
        item[field] = undefined;
      }
    }

    if (item?.learn && item.learn.length === 0) {
      item.learn = undefined;
    }
  }
}

/**
 * Saves minimal item data
 */
async function saveMinimalItemData() {
  // Create items_min.json with only category, name, crafting and projectileDamage
  const minItems = allItems.map(item => {
    const minItem = {};
    // Only include the required fields
    const fieldsToInclude = ['category', 'name', 'crafting', 'projectileDamage'];
    for (const field of fieldsToInclude) {
      if (item[field]) {
        minItem[field] = item[field];
      }
    }
    return minItem;
  });

  minItems.sort(orderByCategoryAndName);
  await fs.writeFile(
    `${CONFIG.EXPORT_FOLDER}items_min.json`,
    JSON.stringify(minItems),
    (err) => {
      if (err) {
        console.error("Error creating the items_min.json file");
      } else {
        console.log("Items_min.json exported");
      }
    }
  );
}

/**
 * Saves individual item files
 */
async function saveIndividualItemFiles() {
  // Create individual JSON files for each item
  const itemsFolder = `${CONFIG.EXPORT_FOLDER}items`;
  fs.ensureDirSync(itemsFolder);

  for (const item of allItems) {
    if (item.name) {
      // Convert item name to snake_case and make it safe for filenames
      const snakeCaseName = convertToSnakeCase(item.name);

      await fs.writeFile(
        `${itemsFolder}/${snakeCaseName}.json`,
        JSON.stringify(item, null, 2),
        (err) => {
          if (err) {
            console.error(`Error creating individual file for ${item.name}`);
          }
        }
      );
    }
  }
  console.log("Individual item JSON files exported");
}

/**
 * Converts a string to snake_case and makes it safe for filenames
 * @param {string} str - String to convert
 * @returns {string} - Snake case string
 */
function convertToSnakeCase(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '_')     // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, '') // Remove any non-alphanumeric characters except underscores
    .replace(/_+/g, '_');       // Replace multiple underscores with a single one
}

/**
 * Processes and saves creature data
 */
async function processCreatureData() {
  let creatures = fileParser.getCreatures();

  // Clean up creature data
  for (const creature of creatures) {
    for (const key of Object.keys(creature)) {
      if (creature[key] === undefined) {
        delete creature[key];
      }
    }
  }

  creatures = creatures.filter(
    (item) => item.name && Object.keys(item).length > 2
  );

  creatures.sort(orderByName);
  if (creatures.length > 0) {
    await saveCreatureData(creatures);
  }
}

/**
 * Saves creature data to files
 * @param {Array} creatures - Creature data to save
 */
async function saveCreatureData(creatures) {
  await fs.writeFile(
    `${CONFIG.EXPORT_FOLDER}creatures.json`,
    JSON.stringify(creatures, null, 2),
    (err) => {
      if (err) {
        console.error("Error creating the file");
      } else {
        console.log("Creatures exported");
      }
    }
  );

  // Clean up creatures for minimal export
  for (const creature of creatures) {
    for (const key of Object.keys(creature)) {
      if (creature[key] === undefined) {
        delete creature[key];
      }
      if (creature?.lootTable !== undefined) {
        creature.lootTable = undefined;
      }
      if (creature?.type !== undefined) {
        creature.type = undefined;
      }
    }
  }

  await fs.writeFile(
    `${CONFIG.EXPORT_FOLDER}creatures_min.json`,
    JSON.stringify(creatures),
    (err) => {
      if (err) {
        console.error("Error creating the file");
      } else {
        console.log("Creatures.min exported");
      }
    }
  );
}

/**
 * Processes and saves translation data
 * @param {Object} translator - Translator object
 */
async function processTranslationData(translator) {
  // Add all item names and other translatable fields to the translationsInUse store
  console.log("Adding all item translations to the translationsInUse store...");
  let translationCount = 0;
  for (const item of allItems) {
    if (item.name) {
      translator.addTranslationInUse(item.name, item.name);
      translationCount++;
    }
    if (item.name && item.translation) {
      translator.addTranslationInUse(item.name, item.translation);
      translationCount++;
    }

    if (item.type && item.name) {
      translator.addTranslationInUse(item.type, item.name);
      translationCount++;
    }

    if (item.description) {
      translator.addTranslationInUse(item.description, item.description);
      translationCount++;
    }
  }
  console.log(
    `Added ${translationCount} item translations to the translationsInUse store`
  );

  // Export the translations
  const translateData = translator.getTranslateFiles();
  console.log(
    `Found ${Object.keys(translateData).length} languages with translations`
  );

  await saveTranslationFiles(translateData);
}

/**
 * Saves translation files
 * @param {Object} translateData - Translation data to save
 */
async function saveTranslationFiles(translateData) {
  for (const language in translateData) {
    const fileData = translateData[language];
    const languageArray = language.split("-");

    // The translator module now handles validation internally, but we'll do a final check
    // to ensure the JSON will be valid before writing to file
    const validatedData = {};
    let skippedEntries = 0;

    // Process each key-value pair to ensure valid JSON
    for (const [key, value] of Object.entries(fileData)) {
      // Skip entries with invalid keys or values
      if (!key || typeof key !== 'string' || !value || typeof value !== 'string') {
        skippedEntries++;
        continue;
      }

      try {
        // Test if the key and value can be properly serialized in JSON
        JSON.parse(JSON.stringify({ [key]: value }));
        validatedData[key] = value;
      } catch (error) {
        // If JSON serialization fails, skip this entry
        console.warn(`Skipping invalid translation entry for key: ${key.substring(0, 30)}...`);
        skippedEntries++;
      }
    }

    if (skippedEntries > 0) {
      console.warn(`Skipped ${skippedEntries} invalid entries for language ${language}`);
    }

    // Ensure the directory exists before writing
    const outputDir = `${CONFIG.EXPORT_FOLDER}locales/${languageArray[0].toLowerCase()}`;
    fs.ensureDirSync(outputDir);

    fs.outputFile(
      `${outputDir}/items.json`,
      JSON.stringify(validatedData, null, 2),
      (err) => {
        if (err) {
          console.error(`Error creating the file: ${language}`, err);
        } else {
          console.log(
            `Translated files ${language} exported with ${Object.keys(validatedData).length} translations`
          );
        }
      }
    );
  }
}

/**
 * Loads directory data recursively
 * @param {string} dirPath - Directory path to load
 * @param {string} folderType - Type of folder to load
 */
function loadDirData(dirPath, folderType) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  let files = [];

  try {
    files = fs.readdirSync(dirPath);
  } catch (error) {
    console.error(`The folder ${dirPath} does not exist`);
    return;
  }

  for (const file of files) {
    const filePath = path.join(dirPath, file);

    const fileData = fs.statSync(filePath);
    if (fileData.isDirectory()) {
      loadDirData(filePath, folderType);
    } else if (file.includes(".json")) {
      processJsonFile(filePath, folderType, file);
    }
  }
}

/**
 * Processes a JSON file based on its folder type
 * @param {string} filePath - Path to the JSON file
 * @param {string} folderType - Type of folder the file is in
 * @param {string} fileName - Name of the file
 */
function processJsonFile(filePath, folderType, fileName) {
  switch (folderType) {
    case "tech":
      fileParser.parseTechData(filePath);
      break;
    case "item":
      fileParser.parseItemData(filePath);
      break;
    case "stringtables":
      fileParser.parseStringTables(filePath);
      break;
    case "trade":
      fileParser.parsePrices(filePath);
      break;
    case "placeables":
      fileParser.parsePlaceableData(filePath);
      break;
    case "cached":
      if (fileName.includes("CachedPlaceablesCosts.json")) {
        fileParser.parseCachedItems(filePath);
      }
      break;
    case "loottables":
      fileParser.parseLootTable(filePath);
      break;
    case "upgrages":
      fileParser.parseUpgrades(filePath);
      break;
    case "blueprintsloot":
      fileParser.parseLootBlueprint(filePath);
      break;
    case "damagetypes":
      fileParser.parseDamage(filePath);
      break;
    case "schematics":
      fileParser.parseSchematicItemData(filePath);
      break;
    case "translation":
      fileParser.parseTranslations(filePath);
      break;
    case "translationOthers":
      fileParser.parseOtherTranslations(filePath);
      break;
    case "lootsites":
      fileParser.parseLootSites(filePath);
      break;
  }
}

/**
 * Sorts items by category and name
 * @param {Object} a - First item
 * @param {Object} b - Second item
 * @returns {number} - Sort order
 */
function orderByCategoryAndName(a, b) {
  if (a.category < b.category) {
    return -1;
  }

  if (a.category > b.category) {
    return 1;
  }

  if (a.name < b.name) {
    return -1;
  }

  if (a.name > b.name) {
    return 1;
  }

  return 0;
}

/**
 * Sorts items by name
 * @param {Object} a - First item
 * @param {Object} b - Second item
 * @returns {number} - Sort order
 */
function orderByName(a, b) {
  if (a.name < b.name) {
    return -1;
  }

  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

// Execute the main function
main().catch(error => {
  console.error("An error occurred during execution:", error);
  process.exit(1);
});