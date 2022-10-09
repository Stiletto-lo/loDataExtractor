require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const comparator = require("./controllers/comparator");
const fileParser = require("./controllers/fileParsers");
const dataParser = require("./controllers/dataParsers");

let allItems = [];
const SHOW_DEV_ITEMS = process.env.SHOW_DEV_ITEMS === "true";
const DEBUG = process.env.DEBUG === "true";
const CONTENT_FOLDER_PATH = process.env.CONTENT_FOLDER_PATH
  ? process.env.CONTENT_FOLDER_PATH
  : "./";

const folderPatch = "./exported/";

const folderTypes = [
  "tech",
  "item",
  "stringtables",
  "trade",
  "placeables",
  "cached",
  "loottables",
  "upgrages",
  "blueprintsloot",
  "damagetypes",
  "schematics",
  "translationOthers",
];

const orderByCategoryAndName = (a, b) => {
  if (a.category < b.category) {
    return -1;
  } else if (a.category > b.category) {
    return 1;
  } else {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    }
  }
  return 0;
};

const orderByName = (a, b) => {
  if (a.name < b.name) {
    return -1;
  } else if (a.name > b.name) {
    return 1;
  }
  return 0;
};

console.info("Loading StringTables");
loadDirData(
  CONTENT_FOLDER_PATH + "Content/Mist/Data/StringTables",
  "stringtables"
);
console.info("Loading Localization");
loadDirData(
  CONTENT_FOLDER_PATH + "Content/Localization/Game/en",
  "translation"
);
loadDirData(
  CONTENT_FOLDER_PATH + "Content/Localization/Game",
  "translationOthers"
);
console.info("Loading TechTree");
loadDirData(CONTENT_FOLDER_PATH + "Content/Mist/Data/TechTree", "tech");
console.info("Loading Items");
loadDirData(CONTENT_FOLDER_PATH + "Content/Mist/Data/Items", "item");
console.info("Loading Placeables");
loadDirData(CONTENT_FOLDER_PATH + "Content/Mist/Data/Placeables", "placeables");
console.info("Loading Recipes");
loadDirData(CONTENT_FOLDER_PATH + "Content/Mist/Data/Recipes", "item");
console.info("Loading Trade");
loadDirData(CONTENT_FOLDER_PATH + "Content/Mist/Data/Trade", "trade");
//console.info("Loading Placeables Cached");
//loadDirData("./Content/Mist/Data/Placeables", "cached");
console.info("Loading Walkers Upgrades");
loadDirData(CONTENT_FOLDER_PATH + "Content/Mist/Data/Walkers", "upgrages");
console.info("Loading Damages");
loadDirData(
  CONTENT_FOLDER_PATH + "Content/Mist/Data/DamageTypes",
  "damagetypes"
);
console.info("Loading Schematics");
loadDirData(
  CONTENT_FOLDER_PATH + "Content/Mist/Data/Items/Schematics",
  "schematics"
);

if (process.env.EXTRACT_LOOT_TABLES === "true") {
  console.info("Loading LootTables");
  loadDirData(
    CONTENT_FOLDER_PATH + "Content/Mist/Data/LootTables",
    "loottables"
  );
  loadDirData(
    CONTENT_FOLDER_PATH + "Content/Mist/Data/LootTables",
    "blueprintsloot"
  );
  fileParser.parseBlueprintsToItems();
}

console.info("Parse Upgrades to Items");
fileParser.parseUpgradesToItems();

allItems = fileParser.getItems();

const translator = fileParser.getTranslator();

if (!SHOW_DEV_ITEMS) {
  allItems = allItems.filter((item) => !item.onlyDevs);
}

console.info("Translating the items");
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
      } else if (item["damageType"] != undefined) {
        delete item["damageType"];
      }
    }
  });
});

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

allItems.sort(orderByName);

if (allItems.length > 0) {
  fs.writeFile(
    folderPatch + "items.json",
    JSON.stringify(allItems, null, 2),
    function (err) {
      if (err) {
        console.error("Error creating the file");
      } else {
        console.log("Items exported");
      }
    }
  );
  allItems.sort(orderByCategoryAndName);
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

if (process.env.TRANSLATE_FILES === "true") {
  let translateData = translator.getTranslateFiles();
  for (const languaje in translateData) {
    let fileData = translateData[languaje];
    if (languaje == "es-ES") {
      console.log(fileData);
    }
    fs.outputFile(
      folderPatch + `locales/${languaje.toLowerCase()}/items.json`,
      JSON.stringify(fileData, null, 2),
      function (err) {
        if (err) {
          console.error("Error creating the file: " + languaje, err);
        } else {
          console.log(`Translated files ${languaje} exported`);
        }
      }
    );
  }
}

if (process.env.COMPARE === "true") {
  comparator.compareItems(allItems, folderPatch);
}

function loadDirData(techTreeDir, folderType) {
  //let dir = path.join(techTreeDir);
  let files = fs.readdirSync(techTreeDir);
  files.forEach((file) => {
    let fileData = fs.statSync(techTreeDir + "/" + file);
    if (fileData.isDirectory()) {
      loadDirData(techTreeDir + "/" + file, folderType);
    } else if (file.includes(".json")) {
      switch (folderType) {
        case "tech":
          fileParser.parseTechData(techTreeDir + "/" + file);
          break;
        case "item":
          fileParser.parseItemData(techTreeDir + "/" + file);
          break;
        case "stringtables":
          fileParser.parseTranslations(techTreeDir + "/" + file);
          break;
        case "trade":
          fileParser.parsePrices(techTreeDir + "/" + file);
          break;
        case "placeables":
          fileParser.parsePlaceableData(techTreeDir + "/" + file);
          break;
        case "cached":
          if (file.includes("CachedPlaceablesCosts.json")) {
            fileParser.parseCachedItems(techTreeDir + "/" + file);
          }
          break;
        case "loottables":
          fileParser.parseLootTable(techTreeDir + "/" + file);
          break;
        case "upgrages":
          fileParser.parseUpgrades(techTreeDir + "/" + file);
          break;
        case "blueprintsloot":
          fileParser.parseLootBlueprint(techTreeDir + "/" + file);
          break;
        case "damagetypes":
          fileParser.parseDamage(techTreeDir + "/" + file);
          break;
        case "schematics":
          fileParser.parseSchematicItemData(techTreeDir + "/" + file);
          break;
        case "translationOthers":
          fileParser.parseOtherTranslations(techTreeDir + "/" + file);
          break;
      }
    }
  });
}
