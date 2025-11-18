/**
 * Service for loading files from the file system
 * 
 * This module provides functions for loading files from different directories
 * and processing them according to their type.
 */

import fs from "fs-extra";
import path from "node:path";
import * as fileParser from "../controllers/fileParsers";
import * as vehicleParser from "../controllers/fileParsers/vehicleParser";

/**
 * Loads files from a directory and processes them according to the specified type
 * @param {string} dir - Directory to load
 * @param {string} type - Type of file to process
 */
export const loadDirData = (dir: string, type: string) => {
	if (!fs.existsSync(dir)) {
		console.error(`Directory ${dir} does not exist`);
		return;
	}

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = `${dir}/${file}`;
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      loadDirData(filePath, type);
    } else if (file.endsWith(".json")) {
      switch (type) {
        case "item":
          fileParser.parseItemData(filePath);
          break;
        case "placeables":
          fileParser.parsePlaceableData(filePath);
          break;
        case "tech":
          fileParser.parseTechData(filePath);
          break;
        case "upgrades":
          fileParser.parseUpgrades(filePath);
          break;
        case "translation":
          fileParser.parseTranslations(filePath);
          break;
        case "translationOthers":
          fileParser.parseOtherTranslations(filePath);
          break;
        case "stringtables":
          fileParser.parseStringTables(filePath);
          break;
        case "lootsites":
          fileParser.parseLootSites(filePath);
          break;
        case "loottables":
          fileParser.parseLootTable(filePath);
          break;
        case "loottemplates":
          fileParser.parseLootTemplate(filePath);
          break;
        case "damagetypes":
          fileParser.parseDamage(filePath);
          break;
        case "trade":
          fileParser.parsePrices(filePath);
          break;
        case "schematics":
          fileParser.parseSchematicItemData(filePath);
          break;
        case "perks":
          fileParser.parsePerkData(filePath);
          break;
        default:
          break;
      }
    }
  }
};

/**
 * Loads all files needed for processing
 * @param {string} contentFolderPath - Base path of the content
 */
export const loadAllFiles = (contentFolderPath: string) => {
  console.info("Loading StringTables");
  loadDirData(
    path.join(contentFolderPath, "Content", "Mist", "Data", "StringTables"),
    "stringtables",
  );
  console.info("Loading Localization");
  loadDirData(
    path.join(contentFolderPath, "Content", "Localization", "Game", "en"),
    "translation",
  );
  loadDirData(
    path.join(contentFolderPath, "Content", "Localization", "Game"),
    "translationOthers",
  );
  console.info("Loading Loot sites");
  loadDirData(
    path.join(contentFolderPath, "Content", "Mist", "Characters", "Creatures"),
    "lootsites",
  );
  loadDirData(
    path.join(contentFolderPath, "Content", "Mist", "Characters", "Worm"),
    "lootsites",
  );
  console.info("Loading TechTree");
  loadDirData(path.join(contentFolderPath, "Content", "Mist", "Data", "TechTree"), "tech");
  console.info("Loading Items");
  loadDirData(path.join(contentFolderPath, "Content", "Mist", "Data", "Items"), "item");
  console.info("Loading Placeables");
  loadDirData(
    path.join(contentFolderPath, "Content", "Mist", "Data", "Placeables"),
    "placeables",
  );
  console.info("Loading Recipes");
  loadDirData(path.join(contentFolderPath, "Content", "Mist", "Data", "TechTree"), "item");
  console.info("Loading Trade");
  loadDirData(path.join(contentFolderPath, "Content", "Mist", "Data", "Trade"), "trade");
  console.info("Loading Placeables Cached");
  loadDirData(path.join(contentFolderPath, "Content", "Mist", "Data", "Placeables"), "item");
  console.info("Loading Walkers Upgrades");
  loadDirData(path.join(contentFolderPath, "Content", "Mist", "Data", "Walkers"), "upgrades");
  console.info("Loading Damages");
  loadDirData(
    path.join(contentFolderPath, "Content", "Mist", "Data", "DamageTypes"),
    "damagetypes",
  );
  console.info("Loading Schematics");
  loadDirData(
    path.join(contentFolderPath, "Content", "Mist", "Data", "Items", "Schematics"),
    "schematics",
  );

  console.info("Building Item Name Glossary");
  fileParser.buildItemNameGlossary(
    path.join(contentFolderPath, "Content", "Mist", "Data", "Items"),
  );

  console.info("Loading LootTables");
  loadDirData(
    path.join(contentFolderPath, "Content", "Mist", "Data", "LootTables", "LootTables"),
    "loottables",
  );
  console.info("Loading LootTemplates");
  loadDirData(
    path.join(contentFolderPath, "Content", "Mist", "Data", "LootTables", "LootTemplates"),
    "loottemplates",
  );
  console.info("Loading LootBox Templates");
  loadDirData(
    path.join(contentFolderPath, "Content", "Mist", "Data", "LootTables", "LootBoxes"),
    "loottemplates",
  );

  // Process vehicle files to extract carry capacity information
  console.info("Loading Vehicle Data");
  vehicleParser.processVehicleFiles(
		path.join(contentFolderPath, "Content", "Mist", "Props", "Vehicles"),
	);

  console.info("Loading Perks");
  loadDirData(path.join(contentFolderPath, "Content", "Mist", "Data", "Perks"), "perks");

};