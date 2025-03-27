/**
 * Tech parser functions for handling tech-related data
 */

const fs = require('node:fs');
const dataParser = require('../../dataParsers');
const translator = require('../../translator');
const utilityFunctions = require('../utilityFunctions');

/**
 * Parse tech data from a file
 * @param {string} filePath - The file path to parse
 */
const parseTechData = (filePath) => {
  const EXTRACT_ALL_DATA = process.env.EXTRACT_ALL_DATA === "true";
  const SHOW_DEV_ITEMS = process.env.SHOW_DEV_ITEMS === "true";

  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData?.[1]?.Type) {
    let item = utilityFunctions.extractItemByType(jsonData[1].Type);

    if (
      jsonData?.[1]?.Properties?.Requirements?.[0]?.ObjectName
    ) {
      item.parent = translator.translateName(
        dataParser.parseName(
          translator,
          jsonData[1].Properties.Requirements[0].ObjectName
        )
      );
    }

    if (EXTRACT_ALL_DATA && jsonData[1]?.Properties?.Cost != 1) {
      let itemCost = { ...require('../../../templates/cost') };
      if (
        jsonData[1].Properties.TechTreeTier &&
        (jsonData[1].Properties.TechTreeTier.includes("Tier4") ||
          jsonData[1].Properties.TechTreeTier.includes("Tier5") ||
          jsonData[1].Properties.TechTreeTier.includes("Tier6"))
      ) {
        itemCost.name = "Tablet";
      } else {
        itemCost.name = "Fragment";
      }
      itemCost.count = jsonData[1].Properties.Cost;

      item.cost = itemCost;
    }

    if (jsonData[1]?.Properties?.bHidden) {
      item.onlyDevs = true;
    }

    if (jsonData[1]?.Properties?.bHidden && !SHOW_DEV_ITEMS) {
      item.parent = undefined;
    }
    if (item.name) {
      if (item.name.includes("Upgrades")) {
        item.category = "Upgrades";
      } else if (item.name.includes("Hook")) {
        item.category = "Grappling Hooks";
      }
    }

    utilityFunctions.getAllItems().push(item);
  }
};

module.exports = {
  parseTechData
};