/**
 * Blueprint parsers for handling blueprint-related data
 */

const fs = require('fs');
const dataParser = require('../dataParsers');
const translator = require('../translator');
const blueprintTemplate = require('../../templates/lootBlueprint');

// Import utility functions
const utilityFunctions = require('./utilityFunctions');

/**
 * Parse location data from a blueprint
 * @param {Object} blueprint - The blueprint object
 * @param {string} location - The location name
 */
const parseLocation = (blueprint, location) => {
  const EXTRACT_ALL_DATA = process.env.EXTRACT_ALL_DATA === "true";

  blueprint.tables.forEach((dataTable) => {
    let dataTableChance = 100;
    let maxIterations = 1;
    if (dataTable.maxIterations) {
      maxIterations = dataTable.minIterations;
    }
    if (dataTable.dataTableChance) {
      dataTableChance = dataTable.dataTableChance;
    }

    let maxChance = (dataTableChance * maxIterations) / 100;

    dataTable.dropItems.forEach((lootItemData) => {
      let item = utilityFunctions.getItem(
        dataParser.parseName(translator, lootItemData.name)
      );
      if (item?.name) {
        let itemDrops = item.drops ? item.drops : [];
        let hasDrop = itemDrops.some((d) => d.location === location);
        if (!hasDrop && item.name != location) {
          let drop = { ...require('../../templates/drop') };
          drop.location = location;
          if (EXTRACT_ALL_DATA && lootItemData.chance) {
            drop.chance = lootItemData.chance;
          }
          if (EXTRACT_ALL_DATA && lootItemData.minQuantity) {
            drop.minQuantity = lootItemData.minQuantity;
          }
          if (EXTRACT_ALL_DATA && lootItemData.maxQuantity) {
            drop.maxQuantity = lootItemData.maxQuantity;
          }
          if (drop.chance) {
            drop.chance = (drop.chance * maxChance) / 100;
          }
          itemDrops.push(drop);
          item.drops = itemDrops;
        }
        utilityFunctions.getAllItems().push(item);
      }
    });
  });
};

/**
 * Parse blueprints to items
 */
const parseBlueprintsToItems = () => {
  const allBlueprints = utilityFunctions.getAllBlueprints();
  const creatures = utilityFunctions.getCreatures();

  allBlueprints.forEach((blueprint) => {
    const locations = creatures.filter((c) => c.lootTable === blueprint.name);
    if (locations.length > 0) {
      locations.forEach((location) => {
        parseLocation(blueprint, location.name);
      });
    } else {
      const location = translator.translateLootSite(blueprint.name);
      parseLocation(blueprint, location);
    }
  });
};

/**
 * Parse loot blueprint data from a file
 * @param {string} filePath - The file path to parse
 */
const parseLootBlueprint = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (
    jsonData[0].Name &&
    jsonData?.[0]?.Type == "BlueprintGeneratedClass"
  ) {
    if (jsonData[1]?.Type) {
      let blueprint = { ...blueprintTemplate };
      blueprint.name = dataParser.parseName(translator, jsonData[1].Type);
      if (jsonData[1]?.Properties?.Loot?.Tables) {
        let allBlueprintTables = [];
        let tables = jsonData[1].Properties.Loot.Tables;
        tables.forEach((table) => {
          if (table?.Table?.ObjectPath) {
            let name = dataParser.parseName(translator, table.Table.ObjectName);
            let dataTable = utilityFunctions.getAllDatatables().find((data) => data.name == name);
            if (dataTable) {
              dataTable.chance = table.RunChance ? table.RunChance : undefined;
              dataTable.minIterations = table.MinIterations
                ? table.MinIterations
                : undefined;
              dataTable.maxIterations = table.MaxIterations
                ? table.MaxIterations
                : undefined;
              dataTable.iterationRunChance = table.PerIterationRunChance
                ? table.PerIterationRunChance
                : undefined;
              dataTable.minQuantityMultiplier = table.MinQuantityMultiplier
                ? table.MinQuantityMultiplier
                : undefined;
              dataTable.maxQuantityMultiplier = table.MaxQuantityMultiplier
                ? table.MaxQuantityMultiplier
                : undefined;
              dataTable.onlyOne = table.bGiveItemOnlyOnce
                ? table.bGiveItemOnlyOnce
                : undefined;

              allBlueprintTables.push(dataTable);
            }
          }
        });
        blueprint.tables = allBlueprintTables;
        utilityFunctions.getAllBlueprints().push(blueprint);
      }
    }
  }
};

module.exports = {
  parseLocation,
  parseBlueprintsToItems,
  parseLootBlueprint
};