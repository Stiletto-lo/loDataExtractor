/**
 * Upgrade parsers for handling upgrade-related data
 */

const fs = require('fs');
const dataParser = require('../dataParsers');
const translator = require('../translator');
const upgradeTemplate = require('../../templates/upgrade');
const upgradeInfoTemplate = require('../../templates/upgradeInfo');
const recipeTemplate = require('../../templates/recipe');

// Import utility functions
const utilityFunctions = require('./utilityFunctions');

/**
 * Parse upgrades data from a file
 * @param {string} filePath - The file path to parse
 */
const parseUpgrades = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[0]?.Name) {
    let profile = dataParser.parseName(translator, jsonData[0].Name);
    let superUp = jsonData[0].Super
      ? dataParser.parseName(translator, jsonData[0].Super)
      : undefined;

    if (jsonData[1]?.Properties) {
      for (const key in jsonData[1]?.Properties) {
        if (key.includes("Upgrade")) {
          let enabled = jsonData[1]?.Properties[key]?.bIsEnabled
            ? jsonData[1].Properties[key].bIsEnabled
            : true;

          if (!enabled) {
            continue;
          }

          let upgrade = { ...upgradeTemplate };
          let upgradeInfo = { ...upgradeInfoTemplate };
          let upgradeInfoValid = false;

          upgrade.profile = profile;
          upgrade.super = superUp;
          upgrade.name = dataParser.parseName(translator, key);

          upgradeInfo.containerSlots = jsonData[1]?.Properties[key]
            ?.ContainerSlots
            ?? undefined;
          upgradeInfo.engineTorqueMultiplier = jsonData[1]?.Properties[key]
            ?.EngineTorqueMultiplier
            ?? undefined;
          upgradeInfo.sprintingTorqueDiscount = jsonData[1]?.Properties[key]
            ?.SprintingTorqueDiscount
            ?? undefined;
          upgradeInfo.additionalParts = jsonData[1]?.Properties[key]
            ?.AdditionalParts
            ?? undefined;
          upgradeInfo.sdditionalSlots = jsonData[1]?.Properties[key]
            ?.AdditionalSlots
            ?? undefined;
          upgradeInfo.containerSlots = jsonData[1]?.Properties[key]
            ?.ContainerSlots
            ?? undefined;
          upgradeInfo.stackSizeOverride = jsonData[1]?.Properties[key]
            ?.StackSizeOverride
            ?? undefined;
          upgradeInfo.bonusHp = jsonData[1]?.Properties[key]?.BonusHp
            ?? undefined;

          Object.keys(upgradeInfo).forEach((keyUpgradeInfo) => {
            if (upgradeInfo[keyUpgradeInfo] === undefined) {
              delete upgradeInfo[keyUpgradeInfo];
            } else {
              upgradeInfoValid = true;
            }
          });

          if (upgradeInfoValid) {
            upgrade.upgradeInfo = upgradeInfo;
          }

          if (jsonData[1]?.Properties[key]?.Inputs) {
            let recipeData = jsonData[1]?.Properties[key]?.Inputs;
            let recipe = { ...recipeTemplate };
            let ingredients = [];
            for (const keyInput in recipeData) {
              let ingredient = utilityFunctions.getIngredientsFromItem(recipeData, keyInput);
              ingredients.push(ingredient);
            }
            if (ingredients.length > 0) {
              recipe.ingredients = ingredients;
            }
            if (jsonData[1]?.Properties[key]?.CraftingTime) {
              recipe.time = jsonData[1].Properties[key].CraftingTime;
            }
            upgrade.crafting = [recipe];
          }
          utilityFunctions.getUpgradesData().push(upgrade);
        }
      }
    }
  }
};

module.exports = {
  parseUpgrades
};