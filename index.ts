import "dotenv/config";
import fs from "fs-extra";
import type { Item, Tech, LootTable, LootTemplate, Creature, Perk, Translator } from "./types";

import { loadAllFiles } from "./services/fileLoader";
import { saveAllFiles } from "./services/fileExporter";
import dataAccess from "./services/dataAccess";

const CONTENT_FOLDER_PATH: string = process.env.CONTENT_FOLDER_PATH || "./";

const EXPORT_FOLDER_PATH: string = "./exported/";

const extractData = async (): Promise<void> => {
	dataAccess.initialize();

	loadAllFiles(CONTENT_FOLDER_PATH);

	await saveAllFiles(EXPORT_FOLDER_PATH);

	console.log("Data extraction successfully completed.");
};

fs.ensureDirSync(EXPORT_FOLDER_PATH);

extractData().catch((error: Error) => {
	console.error("Error during data extraction:", error);
	process.exit(1);
});

export const getAllItems = (): Item[] => dataAccess.getAllItems();
export const getItemByName = (name: string): Item | undefined => dataAccess.getItemByName(name);
export const getItemByType = (type: string): Item[] => dataAccess.getItemByType(type);
export const getAllTechData = (): Tech[] => dataAccess.getAllTechData();
export const getAllLootTables = (): LootTable[] => dataAccess.getAllLootTables();
export const getAllLootTemplates = (): LootTemplate[] => dataAccess.getAllLootTemplates();
export const getAllCreatures = (): Creature[] => dataAccess.getAllCreatures();
export const getTranslator = (): Translator => dataAccess.getTranslator();
export const getAllUpgradesData = (): any[] => dataAccess.getAllUpgradesData();
export const getAllPerks = (): Perk[] => dataAccess.getAllPerks();
export const getPerkByName = (name: string): Perk | undefined => dataAccess.getPerkByName(name);