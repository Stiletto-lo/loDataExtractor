require("dotenv").config();
const fs = require("fs");
const path = require("path");
const comparator = require("./controllers/comparator");
const fileParser = require("./controllers/fileParsers");
const dataParser = require("./controllers/dataParsers");

let allItems = [];
const SHOW_DEV_ITEMS = process.env.SHOW_DEV_ITEMS === "true";
const DEBUG = process.env.DEBUG === "true";

const folderPatch = "./exported/";

const folderTypes = [
  "tech",
  "item",
  "translation",
  "trade",
  "placeables",
  "cached",
  "loottables",
  "upgrages",
  "blueprintsloot",
  "damagetypes",
];

const orderByCategory = (a, b) => {
  if (a.category < b.category) {
    return -1;
  } else if (a.category > b.category) {
    return 1;
  }
  return 0;
};

loadDirData("./Content/Mist/Data/StringTables", "translation");
loadDirData("./Content/Mist/Data/TechTree", "tech");
loadDirData("./Content/Mist/Data/Items", "item");
loadDirData("./Content/Mist/Data/Placeables", "placeables");
loadDirData("./Content/Mist/Data/Recipes", "item");
loadDirData("./Content/Mist/Data/Trade", "trade");
loadDirData("./Content/Mist/Data/Placeables", "cached");

loadDirData("./Content/Mist/Data/Walkers", "upgrages");
loadDirData("./Content/Mist/Data/DamageTypes", "damagetypes");

if (process.env.EXTRACT_LOOT_TABLES === "true") {
  loadDirData("./Content/Mist/Data/LootTables", "loottables");
  loadDirData("./Content/Mist/Data/LootTables", "blueprintsloot");
  fileParser.parseBlueprintsToItems();
}

fileParser.parseUpgradesToItems();

allItems = fileParser.getItems();

const translator = fileParser.getTranslator();

allItems = translator.translateItems(allItems);
allItems = translator.addDescriptions(allItems);

allItems.forEach((item) => {
  Object.keys(item).forEach((key) => {
    if (item[key] === undefined) {
      delete item[key];
    }
    if (!DEBUG) {
      if (item["translation"] != undefined) {
        delete item["translation"];
      } else if (item["type"] != undefined) {
        delete item["type"];
      } else if (item["schematicName"] != undefined) {
        delete item["schematicName"];
      } else if (item["drops"] != undefined && item["drops"].length <= 0) {
        delete item["drops"];
      } else if (
        item["toolInfo"] != undefined &&
        item["toolInfo"].length <= 0
      ) {
        delete item["toolInfo"];
      }
    }
  });
});

if (!SHOW_DEV_ITEMS) {
  allItems = allItems.filter((item) => !item.onlyDevs);
}

allItems = allItems
  .map((item) => {
    let countItems = allItems.filter((item2) => item.name == item2.name);
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
    } else {
      return acc;
    }
  }, []);

allItems = dataParser.itemMerger(allItems, "Long Sawblade", "Sawblade_Tier2");

allItems.sort(orderByCategory);

if (allItems.length > 0) {
  fs.writeFile(
    folderPatch + "itemsDetailed.json",
    JSON.stringify(allItems, null, 2),
    function (err) {
      if (err) {
        console.error("Error creating the file");
      } else {
        console.log("Items detailed exported");
      }
    }
  );
}
if (allItems.length > 0) {
  fs.writeFile(
    folderPatch + "items_min.json",
    JSON.stringify(allItems),
    function (err) {
      if (err) {
        console.error("Error creating the file");
      } else {
        console.log("Items.min exported");
      }
    }
  );
}

/* We remove additional information */
allItems.forEach((item) => {
  item.description = undefined;
  item.projectileDamage = undefined;
  item.experiencieReward = undefined;
  item.stackSize = undefined;
  item.weight = undefined;
  item.durability = undefined;
  item.weaponInfo = undefined;
  item.toolInfo = undefined;
  item.schematicName = undefined;
  item.drops = undefined;
  item.armorInfo = undefined;
  item.structureInfo = undefined;
  item.moduleInfo = undefined;
});

if (allItems.length > 0) {
  fs.writeFile(
    folderPatch + "items.json",
    JSON.stringify(allItems, null, 2),
    function (err) {
      if (err) {
        console.error("Error creating the file");
      } else {
        console.log("Data exported");
      }
    }
  );
}

if (process.env.COMPARE === "true") {
  comparator.compareItems(allItems, folderPatch);
}

function loadDirData(techTreeDir, folderType) {
  let dir = path.join(__dirname, techTreeDir);
  let files = fs.readdirSync(dir);
  files.forEach((file) => {
    let fileData = fs.statSync(techTreeDir + "/" + file);
    if (fileData.isDirectory()) {
      loadDirData(techTreeDir + "/" + file, folderType);
    } else if (file.includes(".json")) {
      switch (folderTypes.indexOf(folderType)) {
        case 0:
          fileParser.parseTechData(techTreeDir + "/" + file);
          break;
        case 1:
          fileParser.parseItemData(techTreeDir + "/" + file);
          break;
        case 2:
          fileParser.parseTranslations(techTreeDir + "/" + file);
          break;
        case 3:
          fileParser.parsePrices(techTreeDir + "/" + file);
          break;
        case 4:
          fileParser.parsePlaceableData(techTreeDir + "/" + file);
          break;
        case 5:
          if (file.includes("CachedPlaceablesCosts.json")) {
            fileParser.parseCachedItems(techTreeDir + "/" + file);
          }
          break;
        case 6:
          fileParser.parseLootTable(techTreeDir + "/" + file);
          break;
        case 7:
          fileParser.parseUpgrades(techTreeDir + "/" + file);
          break;
        case 8:
          fileParser.parseLootBlueprint(techTreeDir + "/" + file);
          break;
        case 9:
          fileParser.parseDamage(techTreeDir + "/" + file);
          break;
      }
    }
  });
}
