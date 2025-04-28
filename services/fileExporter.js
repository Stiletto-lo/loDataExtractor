/**
 * Service for exporting data to files
 * 
 * This module provides functions for exporting processed data
 * to JSON files in different formats.
 */

const fs = require("fs-extra");
const fileParser = require("../controllers/fileParsers");
const dataProcessor = require("./dataProcessor");

/**
 * Exports technology data to JSON files
 * @param {Array} techData - Processed technology data
 * @param {string} folderPath - Export folder path
 * @returns {Promise} - Promise that resolves when export is completed
 */
const exportTechData = async (techData, folderPath) => {
  if (techData.length > 0) {
    console.log(`Processing ${techData.length} tech entries for export...`);

    const normalizedNameMap = new Map();
    const typeMap = new Map();

    for (const tech of techData) {
      if (tech.name && tech.type) {
        if (typeMap.has(tech.type)) {
          const existingTech = typeMap.get(tech.type);

          const existingTechProps = Object.entries(existingTech).filter(([_, v]) => v !== undefined && v !== null).length;
          const currentTechProps = Object.entries(tech).filter(([_, v]) => v !== undefined && v !== null).length;

          if (currentTechProps > existingTechProps) {
            typeMap.set(tech.type, tech);
          }
        } else {
          typeMap.set(tech.type, tech);
        }
      } else if (tech.name) {
        normalizedNameMap.set(tech.name, tech);
      }
    }

    const uniqueTechData = [
      ...Array.from(typeMap.values()),
      ...Array.from(normalizedNameMap.values()).filter(tech => !typeMap.has(tech.type))
    ];

    console.log(`Reduced to ${uniqueTechData.length} unique tech entries after deduplication`);

    await fs.writeFile(
      `${folderPath}tech.json`,
      JSON.stringify(uniqueTechData, null, 2),
      (err) => {
        if (err) {
          console.error("Error creating the tech.json file");
        } else {
          console.log("Tech data exported to tech.json");

          const { unifyTechTree } = require("../utils/techTreeUnifier");
          unifyTechTree(`${folderPath}tech.json`);
        }
      },
    );

    await fs.writeFile(
      `${folderPath}tech_min.json`,
      JSON.stringify(uniqueTechData),
      (err) => {
        if (err) {
          console.error("Error creating the tech_min.json file");
        } else {
          console.log("Tech_min.json exported");
        }
      },
    );
  }
};

/**
 * Exports item data to JSON files
 * @param {Array} allItems - Processed items
 * @param {Array} minItems - Minimal version of items
 * @param {string} folderPath - Export folder path
 * @returns {Promise} - Promise that resolves when export is completed
 */
const exportItemsData = async (allItems, minItems, folderPath) => {
  console.info("Exporting items.json");
  if (allItems.length > 0) {
    // Process strongbox drops
    console.log("Processing strongbox drops before export...");
    const dataProcessor = require("./dataProcessor");
    const itemsWithStrongboxDrops = dataProcessor.processStrongboxes(allItems);

    // Apply ingredient name fixing before exporting
    const ingredientNameFixer = require("../utils/ingredientNameFixer");
    console.log("Applying ingredient name fixing to items before export...");
    const fixedItems = ingredientNameFixer.fixIngredientNames(itemsWithStrongboxDrops);
    const fixedMinItems = ingredientNameFixer.fixIngredientNames(minItems);

    await fs.writeFile(
      `${folderPath}items.json`,
      JSON.stringify(fixedItems, null, 2),
      (err) => {
        if (err) {
          console.error("Error creating the file");
        } else {
          console.log("Items exported with fixed ingredient names");

          // Run the tech tree unifier to fix inconsistencies
          const {
            unifyTechTreeAndItems,
          } = require("../utils/techTreeItemUnifier");
          console.log("Running tech tree item unifier...");
          const unifyResult = unifyTechTreeAndItems(`${folderPath}items.json`);
          if (unifyResult.success) {
            console.log(
              `Tech tree unification complete. Fixed ${unifyResult.fixedCount} learn entries.`,
            );
          } else {
            console.error(`Tech tree unification failed: ${unifyResult.error}`);
          }
        }
      },
    );

    // Save the item name glossary
    console.log("Saving item name glossary...");
    fileParser.saveGlossary(`${folderPath}itemNameGlossary.json`);

    console.info("Exporting items_min.json");
    await fs.writeFile(
      `${folderPath}items_min.json`,
      JSON.stringify(fixedMinItems),
      (err) => {
        if (err) {
          console.error("Error creating the items_min.json file");
        } else {
          console.log("Items_min.json exported with fixed ingredient names");
        }
      },
    );

    // Create individual JSON files for each item
    // Pass the fixed items to ensure consistency
    await exportIndividualItemFiles(fixedItems, folderPath);
  }
};

/**
 * Exports individual JSON files for each item
 * @param {Array} allItems - Processed items
 * @param {string} folderPath - Export folder path
 * @returns {Promise} - Promise that resolves when export is completed
 */
const exportIndividualItemFiles = async (allItems, folderPath) => {
  const itemsFolder = `${folderPath}items`;
  fs.ensureDirSync(itemsFolder);

  // Note: Ingredient names are already fixed in the main export function

  // Load creatures to get drop information
  console.log("Loading creature information for drop mapping...");
  const creatures = dataProcessor.processCreatures();

  // Create a map of items to creatures that drop them
  const itemToCreaturesMap = new Map();

  // Iterate through all creatures and their drops
  for (const creature of creatures) {
    if (creature.drops && Array.isArray(creature.drops)) {
      for (const drop of creature.drops) {
        if (drop.name) {
          // If this item is not in the map, initialize an empty array
          if (!itemToCreaturesMap.has(drop.name)) {
            itemToCreaturesMap.set(drop.name, []);
          }

          // Add this creature to the item's source list
          const creatureInfo = {
            name: creature.name,
            chance: drop.chance,
            minQuantity: drop.minQuantity,
            maxQuantity: drop.maxQuantity,
            tier: creature.tier
          };

          // Avoid duplicates
          const existingCreatures = itemToCreaturesMap.get(drop.name);
          if (!existingCreatures.some(c => c.name === creature.name)) {
            existingCreatures.push(creatureInfo);
          }
        }
      }
    }
  }

  console.log(`Drop map created with ${itemToCreaturesMap.size} items`);

  const normalizedNameMap = new Map();
  const typeMap = new Map(); // Mapa para rastrear items por tipo

  for (const item of allItems) {
    if (item.name && item.type) {
      if (typeMap.has(item.type)) {
        const existingItem = typeMap.get(item.type);

        const existingItemProps = Object.entries(existingItem).filter(([_, v]) => v !== undefined && v !== null).length;
        const currentItemProps = Object.entries(item).filter(([_, v]) => v !== undefined && v !== null).length;

        if (currentItemProps > existingItemProps) {
          typeMap.set(item.type, item);
        }
      } else {
        typeMap.set(item.type, item);
      }
    }
  }

  for (const item of typeMap.values()) {
    if (item.name) {
      const droppedBy = itemToCreaturesMap.get(item.name) || [];

      const dataToExport = {
        name: item?.name,
        parent: item?.parent,
        type: item?.type,
        category: item?.category,
        trade_price: item?.trade_price,
        stackSize: item?.stackSize,
        weight: item?.weight,
        description: item?.description,
        experiencieReward: item?.experiencieReward,
        durability: item?.durability,
        wikiVisibility: item?.wikiVisibility,
        onlyDevs: item?.onlyDevs,
        learn: item?.learn,
        crafting: item?.crafting,
        structureInfo: item?.structureInfo,
        projectileDamage: item?.projectileDamage,
        weaponInfo: item?.weaponInfo,
        moduleInfo: item?.moduleInfo,
        toolInfo: item?.toolInfo,
        armorInfo: item?.armorInfo,
        walkerinfo: item?.walkerinfo,
        upgradeInfo: item?.upgradeInfo,
        droppedBy: droppedBy.length > 0 ? droppedBy : undefined,
        whereToFarm: item?.whereToFarm,
        drops: item?.drops,
      }

      // Convert item name to snake_case and make it safe for filenames
      // Ensure we're using the normalized name format with consistent handling
      // of different formats (camelCase, hyphenated, spaced)
      const normalizedName = item.name
        .replace(/-/g, ' ')                   // Replace hyphens with spaces
        .replace(/\s+/g, ' ')                 // Replace multiple spaces with a single space
        .trim();                              // Trim leading/trailing spaces

      // Log if we're normalizing a name that might have duplicates
      if (normalizedName !== item.name) {
        console.log(`Normalized filename: ${item.name} -> ${normalizedName}`);
      }

      const snakeCaseName = normalizedName
        .toLowerCase()
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, "") // Remove any non-alphanumeric character except underscores
        .replace(/_+/g, "_"); // Replace multiple underscores with a single one

      if (normalizedNameMap.has(snakeCaseName)) {
        const existingItem = normalizedNameMap.get(snakeCaseName);
        console.log(`Duplicate filename detected: "${item.name}" and "${existingItem}" normalize to same filename: ${snakeCaseName}`);

        if (item.type) {
          const typeBasedName = item.type
            .replace(/_C$/, '')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
            .replace(/_+/g, "_");

          console.log(`Using type-based filename instead: ${typeBasedName}`);
          normalizedNameMap.set(typeBasedName, item.name);
          await fs.writeFile(
            `${itemsFolder}/${typeBasedName}.json`,
            JSON.stringify(dataToExport, null, 2),
            (err) => {
              if (err) {
                console.error(`Error creating individual file for ${item.name}`);
              }
            },
          );
          return;
        }

        const existingFilePath = `${itemsFolder}/${snakeCaseName}.json`;
        if (fs.existsSync(existingFilePath)) {
          try {
            const existingData = JSON.parse(fs.readFileSync(existingFilePath, 'utf8'));

            const existingKeys = Object.keys(existingData).filter(k => existingData[k] !== undefined && existingData[k] !== null);
            const newKeys = Object.keys(dataToExport).filter(k => dataToExport[k] !== undefined && dataToExport[k] !== null);

            if (existingKeys.length >= newKeys.length) {
              console.log(`Keeping existing file for ${snakeCaseName} as it has more complete data`);
              return;
            }
          } catch (e) {
            console.error(`Error reading existing file ${existingFilePath}:`, e);
          }
        }
      }

      normalizedNameMap.set(snakeCaseName, item.name);

      await fs.writeFile(
        `${itemsFolder}/${snakeCaseName}.json`,
        JSON.stringify(dataToExport, null, 2),
        (err) => {
          if (err) {
            console.error(`Error creating individual file for ${item.name}`);
          }
        },
      );
    }
  }
  console.log("Individual item JSON files exported");
};

/**
 * Exports creature data to JSON files
 * @param {Array} creatures - Processed creatures
 * @param {Array} minCreatures - Minimal version of creatures
 * @param {string} folderPath - Export folder path
 * @returns {Promise} - Promise that resolves when export is completed
 */
const exportCreaturesData = async (creatures, minCreatures, folderPath) => {
  if (creatures.length > 0) {
    // Export main creatures.json file
    await fs.writeFile(
      `${folderPath}creatures.json`,
      JSON.stringify(creatures, null, 2),
      (err) => {
        if (err) {
          console.error("Error creating the creatures.json file");
        } else {
          console.log(`Creatures exported (${creatures.length} entries)`);
        }
      },
    );

    await fs.writeFile(
      `${folderPath}creatures_min.json`,
      JSON.stringify(minCreatures),
      (err) => {
        if (err) {
          console.error("Error creating the creatures_min.json file");
        } else {
          console.log("Creatures_min.json exported");
        }
      },
    );

    // Export individual creature files
    const creatureProcessor = require("../utils/creatureProcessor");
    await creatureProcessor.exportIndividualCreatureFiles(
      creatures,
      folderPath,
    );
  }
};

/**
 * Exports translation data to JSON files
 * @param {Object} translateData - Processed translation data
 * @param {string} folderPath - Export folder path
 * @returns {Promise} - Promise that resolves when export is completed
 */
const exportTranslationsData = async (translateData, folderPath) => {
  for (const language in translateData) {
    const fileData = translateData[language];
    const languageArray = language.split("-");

    // Validate translation data
    const validatedData = dataProcessor.validateTranslationData(fileData);

    // Ensure directory exists before writing
    const outputDir = `${folderPath}locales/${languageArray[0].toLowerCase()}`;
    fs.ensureDirSync(outputDir);

    fs.outputFile(
      `${folderPath}locales/${languageArray[0].toLowerCase()}/items.json`,
      JSON.stringify(validatedData, null, 2),
      (err) => {
        if (err) {
          console.error(`Error creating the file: ${language}`, err);
        } else {
          console.log(
            `Translated files ${language} exported with ${Object.keys(validatedData).length} translations`,
          );
        }
      },
    );
  }
};

/**
 * Exports all processed data to files
 * @param {string} folderPath - Export folder path
 * @returns {Promise} - Promise that resolves when export is completed
 */
const saveAllFiles = async (folderPath) => {
  // Process and export item data
  const allItems = dataProcessor.processItems();
  const minItems = dataProcessor.createMinItems(allItems);
  await exportItemsData(allItems, minItems, folderPath);

  // Process and export technology data
  const techData = dataProcessor.processTechData();
  await exportTechData(techData, folderPath);

  // Process and export creature data
  const creatures = dataProcessor.processCreatures();
  const minCreatures = dataProcessor.createMinCreatures(creatures);
  await exportCreaturesData(creatures, minCreatures, folderPath);

  // Process and export translation data
  const translateData = dataProcessor.processTranslations();
  await exportTranslationsData(translateData, folderPath);
};

module.exports = {
  exportTechData,
  exportItemsData,
  exportIndividualItemFiles,
  exportCreaturesData,
  exportTranslationsData,
  saveAllFiles,
};