/**
 * Loot parsers for handling loot-related data
 */

const fs = require('fs');
const dataParser = require('../dataParsers');
const translator = require('../translator');
const dataTableTemplate = require('../../templates/datatable');
const dropDataTemplate = require('../../templates/dropData');
const creatureTemplate = require('../../templates/creature');

// Import utility functions
const utilityFunctions = require('./utilityFunctions');

/**
 * Parse loot table data from a file
 * @param {string} filePath - The file path to parse
 */
const parseLootTable = (filePath) => {
  const EXTRACT_ALL_DATA = process.env.EXTRACT_ALL_DATA === "true";

  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (
    jsonData[0].Name &&
    jsonData[0].Rows &&
    jsonData?.[0]?.Type == "DataTable"
  ) {
    let dataTable = { ...dataTableTemplate };
    dataTable.name = dataParser.parseName(translator, jsonData[0].Name);
    let lootItems = jsonData[0].Rows;
    let dataTableItems = [];
    Object.keys(lootItems).forEach((key) => {
      if (lootItems[key].Item) {
        let name = dataParser.parseName(translator, key);
        if (name) {
          let completeItem = utilityFunctions.getItemByType(
            dataParser.parseType(lootItems[key].Item.AssetPathName)
          );
          if (completeItem?.name) {
            name = completeItem.name;
          } else if (
            lootItems[key]?.Item?.AssetPathName?.includes?.('Schematics')
          ) {
            name = name + " Schematic";
          }
          let hasDrop = dataTable.dropItems.some((d) => d.name === name);
          if (!hasDrop && name != dataTable.name) {
            let drop = { ...dropDataTemplate };
            drop.name = name;
            if (EXTRACT_ALL_DATA && lootItems[key].Chance) {
              drop.chance = lootItems[key].Chance;
            }
            if (EXTRACT_ALL_DATA && lootItems[key].MinQuantity) {
              drop.minQuantity = lootItems[key].MinQuantity;
            }
            if (EXTRACT_ALL_DATA && lootItems[key].MaxQuantity) {
              drop.maxQuantity = lootItems[key].MaxQuantity;
            }
            dataTableItems.push(drop);
          }
        }
      }
    });
    dataTable.dropItems = dataTableItems;
    utilityFunctions.getAllDatatables().push(dataTable);
  }
};

/**
 * Get loot site name from object data
 * @param {Object} objectData - The object data
 * @returns {string|undefined} - The loot site name or undefined
 */
const getLootSiteNameFromObject = (objectData) =>
  objectData?.Properties?.MobName?.LocalizedString ??
  objectData?.Properties?.CampName?.LocalizedString ??
  undefined;

/**
 * Parse loot sites data from a file
 * @param {string} filePath - The file path to parse
 */
const parseLootSites = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  if (!rawdata) {
    return;
  }

  let jsonData = JSON.parse(rawdata);
  if (!jsonData) {
    return;
  }

  const objectsFiltered = jsonData.filter((o) => o?.Type !== "Function" && o?.Type !== "BlueprintGeneratedClass" && !o?.Type.includes("Component"));

  let name = objectsFiltered?.[0]?.Type;
  let translation = getLootSiteNameFromObject(objectsFiltered?.[0]);

  if (!translation || !name) {
    return;
  }

  translator.addLootSiteTranslation(
    name,
    translation
  );

  const creature = { ...creatureTemplate, type: name, name: translation };

  const additionalInfo = jsonData.find((o) => o.Type === "MistHumanoidMobVariationComponent");
  if (additionalInfo) {
    creature.experiencie = additionalInfo?.Properties?.ExperienceAward;
    creature.health = additionalInfo?.Properties?.MaxHealth;
    creature.lootTable = dataParser.parseObjectPath(additionalInfo?.Properties?.Loot?.ObjectPath);
  }

  utilityFunctions.getCreatures().push(creature);
};

module.exports = {
  parseLootTable,
  getLootSiteNameFromObject,
  parseLootSites
};