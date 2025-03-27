/**
 * Upgrade parsers for handling upgrade-related data
 */

const fs = require('node:fs');
const dataParser = require('../dataParsers');
const translator = require('../translator');
const upgradeTemplate = require('../../templates/upgrade');
const upgradeInfoTemplate = require('../../templates/upgradeInfo');
const recipeTemplate = require('../../templates/recipe');
const utilityFunctions = require('./utilityFunctions');

/**
 * Extract upgrade information from properties
 * @param {Object} properties - The upgrade properties
 * @param {string} key - The current upgrade key
 * @returns {Object} The extracted upgrade info and its validity
 */
const extractUpgradeInfo = (properties, key) => {
  const upgradeInfo = { ...upgradeInfoTemplate };
  const propertyData = properties[key] || {};

  // Map property fields to upgradeInfo fields
  const propertyMapping = {
    'ContainerSlots': 'containerSlots',
    'EngineTorqueMultiplier': 'engineTorqueMultiplier',
    'SprintingTorqueDiscount': 'sprintingTorqueDiscount',
    'AdditionalParts': 'additionalParts',
    'AdditionalSlots': 'additionalSlots',
    'StackSizeOverride': 'stackSizeOverride',
    'BonusHp': 'bonusHp'
  };

  // Extract properties using the mapping
  let isValid = false;
  Object.entries(propertyMapping).forEach(([sourceKey, targetKey]) => {
    if (propertyData[sourceKey] !== undefined) {
      upgradeInfo[targetKey] = propertyData[sourceKey];
      isValid = true;
    }
  });

  return { upgradeInfo, isValid };
};

/**
 * Extract recipe data from upgrade properties
 * @param {Object} properties - The upgrade properties
 * @param {string} key - The current upgrade key
 * @returns {Object|null} The recipe object or null if no recipe data
 */
const extractRecipeData = (properties, key) => {
  const propertyData = properties[key] || {};
  if (!propertyData.Inputs) return null;

  const recipe = { ...recipeTemplate };
  const ingredients = [];

  // Extract ingredients
  for (const inputKey in propertyData.Inputs) {
    const ingredient = utilityFunctions.getIngredientsFromItem(propertyData.Inputs, inputKey);
    ingredients.push(ingredient);
  }

  if (ingredients.length > 0) {
    recipe.ingredients = ingredients;
  }

  // Add crafting time if available
  if (propertyData.CraftingTime) {
    recipe.time = propertyData.CraftingTime;
  }

  return recipe;
};

/**
 * Process a single upgrade entry
 * @param {Object} jsonData - The parsed JSON data
 * @param {string} key - The current upgrade key
 * @param {string} profile - The profile name
 * @param {string|undefined} superUp - The super upgrade name
 */
const processUpgradeEntry = (jsonData, key, profile, superUp) => {
  const properties = jsonData[1]?.Properties || {};
  const propertyData = properties[key] || {};

  // Skip disabled upgrades
  const isEnabled = propertyData.bIsEnabled !== undefined ? propertyData.bIsEnabled : true;
  if (!isEnabled) return;

  // Create upgrade object
  const upgrade = { ...upgradeTemplate };
  upgrade.profile = profile;
  upgrade.super = superUp;
  upgrade.name = dataParser.parseName(translator, key);

  // Extract upgrade info
  const { upgradeInfo, isValid } = extractUpgradeInfo(properties, key);
  if (isValid) {
    upgrade.upgradeInfo = upgradeInfo;
  }

  // Extract recipe data
  const recipe = extractRecipeData(properties, key);
  if (recipe) {
    upgrade.crafting = [recipe];
  }

  // Add to upgrades data
  utilityFunctions.getUpgradesData().push(upgrade);
};

/**
 * Parse upgrades data from a file
 * @param {string} filePath - The file path to parse
 */
const parseUpgrades = (filePath) => {
  try {
    const rawdata = fs.readFileSync(filePath);
    const jsonData = JSON.parse(rawdata);

    if (!jsonData[0]?.Name) return;

    // Extract profile and super upgrade information
    const profile = dataParser.parseName(translator, jsonData[0].Name);
    const superUp = jsonData[0].Super
      ? dataParser.parseName(translator, jsonData[0].Super)
      : undefined;

    // Process each upgrade entry
    if (jsonData[1]?.Properties) {
      Object.keys(jsonData[1].Properties)
        .filter(key => key.includes("Upgrade"))
        .forEach(key => processUpgradeEntry(jsonData, key, profile, superUp));
    }
  } catch (error) {
    console.error(`Error parsing upgrades from ${filePath}:`, error);
  }
};

module.exports = {
  parseUpgrades
};