/**
 * Creature Enhancer Utility
 *
 * This module is responsible for enhancing creature data with additional information
 * such as descriptions, categories, tiers, and other metadata.
 */

const creatureTemplate = require('../../templates/creature');

/**
 * Enhances basic creature data with additional information
 * @param {Object} creature - The basic creature object to enhance
 * @param {Object} translator - The translator object for localization
 * @returns {Object} - Enhanced creature object with additional metadata
 */
function enhanceCreatureData(creature, translator) {
  // Create a new creature object based on the template
  const enhancedCreature = { ...creatureTemplate };

  // Copy existing properties
  for (const key in creature) {
    if (creature[key] !== undefined) {
      enhancedCreature[key] = creature[key];
    }
  }

  // Extract category and tier from type if not already set
  extractCategoryAndTier(enhancedCreature);

  // Add description if available from translator
  addCreatureDescription(enhancedCreature, translator);

  // Clean up undefined properties
  for (const key in Object.keys(enhancedCreature)) {
    if (enhancedCreature[key] === undefined) {
      delete enhancedCreature[key];
    }
  }

  return enhancedCreature;
}

/**
 * Extracts category and tier information from creature type
 * @param {Object} creature - The creature object to process
 */
function extractCategoryAndTier(creature) {
  if (creature.type && !creature.category) {
    const typeMatch = creature.type.match(/T(\d)_(\w+)_C/);
    if (typeMatch) {
      // If not already set, extract from type
      if (!creature.tier) {
        creature.tier = `T${typeMatch[1]}`;
      }

      // If category not set and we can extract it from type
      if (!creature.category && typeMatch[2]) {
        // Convert from camelCase to readable format (e.g., RupuWarrior -> Rupu)
        const categoryName = typeMatch[2].replace(/([a-z])([A-Z])/g, '$1 $2');
        // Usually the first word is the category (e.g., "Rupu" from "Rupu Warrior")
        creature.category = categoryName.split(' ')[0];
      }
    }
  }

  // Set category based on loot table for specific cases - this takes precedence over type-based category
  if (creature.lootTable?.includes('Rupu')) {
    creature.category = 'Rupu';
  }
}

/**
 * Adds description to creature from translator
 * @param {Object} creature - The creature object to add description to
 * @param {Object} translator - The translator object for localization
 */
function addCreatureDescription(creature, translator) {
  if (creature.name && translator) {
    // Use the correct method to get translations
    const descriptionKey = `${creature.name}_Description`;

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
      creature.description = description;
    }
  }
}

module.exports = {
  enhanceCreatureData,
  extractCategoryAndTier,
  addCreatureDescription
};