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
    await fs.writeFile(
      `${folderPath}tech.json`,
      JSON.stringify(techData, null, 2),
      (err) => {
        if (err) {
          console.error("Error creating the tech.json file");
        } else {
          console.log("Tech data exported to tech.json");
        }
      },
    );

    await fs.writeFile(
      `${folderPath}tech_min.json`,
      JSON.stringify(techData),
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
    await fs.writeFile(
      `${folderPath}items.json`,
      JSON.stringify(allItems, null, 2),
      (err) => {
        if (err) {
          console.error("Error creating the file");
        } else {
          console.log("Items exported");

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
      JSON.stringify(minItems),
      (err) => {
        if (err) {
          console.error("Error creating the items_min.json file");
        } else {
          console.log("Items_min.json exported");
        }
      },
    );

    // Create individual JSON files for each item
    await exportIndividualItemFiles(allItems, folderPath);
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

  // Cargar las criaturas para obtener información de drops
  console.log("Cargando información de criaturas para mapear drops...");
  const creatures = dataProcessor.processCreatures();

  // Crear un mapa de ítems a criaturas que los dropean
  const itemToCreaturesMap = new Map();

  // Recorrer todas las criaturas y sus drops
  for (const creature of creatures) {
    if (creature.drops && Array.isArray(creature.drops)) {
      for (const drop of creature.drops) {
        if (drop.name) {
          // Si este ítem no está en el mapa, inicializar un array vacío
          if (!itemToCreaturesMap.has(drop.name)) {
            itemToCreaturesMap.set(drop.name, []);
          }

          // Añadir esta criatura a la lista de fuentes del ítem
          const creatureInfo = {
            name: creature.name,
            chance: drop.chance,
            minQuantity: drop.minQuantity,
            maxQuantity: drop.maxQuantity,
            tier: creature.tier
          };

          // Evitar duplicados
          const existingCreatures = itemToCreaturesMap.get(drop.name);
          if (!existingCreatures.some(c => c.name === creature.name)) {
            existingCreatures.push(creatureInfo);
          }
        }
      }
    }
  }

  console.log(`Mapa de drops creado con ${itemToCreaturesMap.size} ítems`);

  for (const item of allItems) {
    if (item.name) {
      // Obtener las criaturas que dropean este ítem
      const droppedBy = itemToCreaturesMap.get(item.name) || [];

      const dataToExport = {
        name: item?.name,
        parent: item?.parent,
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
      }

      // Convert item name to snake_case and make it safe for filenames
      const snakeCaseName = item.name
        .toLowerCase()
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, "") // Remove any non-alphanumeric character except underscores
        .replace(/_+/g, "_"); // Replace multiple underscores with a single one

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
  for (const languaje in translateData) {
    const fileData = translateData[languaje];
    const languajeArray = languaje.split("-");

    // Validate translation data
    const validatedData = dataProcessor.validateTranslationData(fileData);

    // Ensure directory exists before writing
    const outputDir = `${folderPath}locales/${languajeArray[0].toLowerCase()}`;
    fs.ensureDirSync(outputDir);

    fs.outputFile(
      `${folderPath}locales/${languajeArray[0].toLowerCase()}/items.json`,
      JSON.stringify(validatedData, null, 2),
      (err) => {
        if (err) {
          console.error(`Error creating the file: ${languaje}`, err);
        } else {
          console.log(
            `Translated files ${languaje} exported with ${Object.keys(validatedData).length} translations`,
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