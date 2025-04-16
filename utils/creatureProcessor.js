/**
 * Creature Processor Utility
 *
 * This module enhances creature data processing by adding more detailed information
 * to creature exports, including descriptions, spawn locations, behavior patterns,
 * attacks, resistances, and weaknesses.
 */

const fs = require('fs-extra');
const path = require('node:path');
const creatureTemplate = require('../templates/creature');

/**
 * Processes creature data to enhance it with additional information
 * @param {Array} creatures - The array of creature objects to process
 * @param {Object} translator - The translator object for localization
 * @param {Object} lootTables - The loot tables data for drop information
 * @returns {Array} - Enhanced creature data
 */
function processCreatures(creatures, translator, lootTables = {}) {
  if (!Array.isArray(creatures) || creatures.length === 0) {
    console.warn('No creatures to process');
    return [];
  }

  console.info(`Processing ${creatures.length} creatures with enhanced data`);

  return creatures.map(creature => {
    // Create a new creature object based on the template
    const enhancedCreature = { ...creatureTemplate };

    // Copy existing properties
    for (const key in Object.keys(creature)) {
      if (creature[key] !== undefined) {
        enhancedCreature[key] = creature[key];
      }
    }

    // Extract category and tier from type if not already set
    if (enhancedCreature.type && !enhancedCreature.category) {
      const typeMatch = enhancedCreature.type.match(/T(\d)_(\w+)_C/);
      if (typeMatch) {
        // If not already set, extract from type
        if (!enhancedCreature.tier) {
          enhancedCreature.tier = `T${typeMatch[1]}`;
        }

        // If category not set and we can extract it from type
        if (!enhancedCreature.category && typeMatch[2]) {
          // Convert from camelCase to readable format (e.g., RupuWarrior -> Rupu)
          const categoryName = typeMatch[2].replace(/([a-z])([A-Z])/g, '$1 $2');
          // Usually the first word is the category (e.g., "Rupu" from "Rupu Warrior")
          enhancedCreature.category = categoryName.split(' ')[0];
        }
      }
    }

    // Process loot table to extract drop information
    if (enhancedCreature.lootTable && lootTables[enhancedCreature.lootTable]) {
      const lootTable = lootTables[enhancedCreature.lootTable];

      // Initialize dropQuantity if not already present
      if (!enhancedCreature.dropQuantity || Object.keys(enhancedCreature.dropQuantity).length === 0) {
        enhancedCreature.dropQuantity = {
          min: lootTable.minQuantity || 0,
          max: lootTable.maxQuantity || 0
        };
      }

      // Add drop chance if available
      if (lootTable.chance) {
        enhancedCreature.dropChance = lootTable.chance;
      }
    }

    // Set category based on loot table for specific cases - this takes precedence over type-based category
    if (enhancedCreature.lootTable?.includes('Rupu')) {
      enhancedCreature.category = 'Rupu';
    }

    // Add description if available from translator
    if (enhancedCreature.name && translator) {
      // Use the correct method to get translations
      const descriptionKey = `${enhancedCreature.name}_Description`;

      // Try to find description using various methods available in the translator
      let description = null;

      // Check if description exists in allDescriptions
      if (translator.allDescriptions?.[descriptionKey]) {
        description = translator.allDescriptions[descriptionKey];
      }
      // Try searchName method which is used throughout the codebase
      else if (translator.searchName) {
        description = translator.searchName(descriptionKey);
      }
      // Try translateName as fallback
      else if (translator.translateName) {
        description = translator.translateName(descriptionKey);
      }

      if (description && description !== descriptionKey) {
        enhancedCreature.description = description;
      }
    }

    for (const key in Object.keys(enhancedCreature)) {
      if (enhancedCreature[key] === undefined) {
        delete enhancedCreature[key];
      }
    }

    return enhancedCreature;
  }).filter(creature => creature.name && Object.keys(creature).length > 2);
}

/**
 * Exports creatures to individual JSON files
 * @param {Array} creatures - The array of processed creature objects
 * @param {string} exportFolder - The folder path to export to
 */
async function exportIndividualCreatureFiles(creatures, exportFolder) {
  if (!Array.isArray(creatures) || creatures.length === 0) {
    console.warn('No creatures to export individually');
    return;
  }

  const creaturesFolder = path.join(exportFolder, 'creatures');
  await fs.ensureDir(creaturesFolder);

  console.info(`Exporting ${creatures.length} individual creature files to ${creaturesFolder}`);

  for (const creature of creatures) {
    if (creature.name) {
      // Convert creature name to snake_case and make it safe for filenames
      const snakeCaseName = creature.name
        .toLowerCase()
        .replace(/\s+/g, '_')     // Replace spaces with underscores
        .replace(/[^a-z0-9_]/g, '') // Remove any non-alphanumeric characters except underscores
        .replace(/_+/g, '_');       // Replace multiple underscores with a single one

      try {
        await fs.writeFile(
          path.join(creaturesFolder, `${snakeCaseName}.json`),
          JSON.stringify(creature, null, 2)
        );
      } catch (err) {
        console.error(`Error creating individual file for ${creature.name}:`, err);
      }
    }
  }

  console.log('Individual creature JSON files exported');
}

module.exports = {
  processCreatures,
  exportIndividualCreatureFiles
};