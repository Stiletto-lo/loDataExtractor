import "dotenv/config";
import fs from "fs-extra";

import * as fileLoader from "./services/fileLoader";
import * as fileExporter from "./services/fileExporter";
import dataAccess from "./services/dataAccess";

const CONTENT_FOLDER_PATH = process.env.CONTENT_FOLDER_PATH
	? process.env.CONTENT_FOLDER_PATH
	: "./";
const EXPORT_FOLDER_PATH = "./exported/";

const extractData = async () => {
	dataAccess.initialize();

	fileLoader.loadAllFiles(CONTENT_FOLDER_PATH);

	await fileExporter.saveAllFiles(EXPORT_FOLDER_PATH);

	console.log("Data extraction successfully completed.");
};

fs.ensureDirSync(EXPORT_FOLDER_PATH);

extractData().catch((error) => {
	console.error("Error during data extraction:", error);
	process.exit(1);
});

export const getAllItems = () => dataAccess.getAllItems();
export const getItemByName = (name: string) => dataAccess.getItemByName(name);
export const getItemByType = (type: string) => dataAccess.getItemByType(type);
export const getAllTechData = () => dataAccess.getAllTechData();
export const getAllLootTables = () => dataAccess.getAllLootTables();
export const getAllLootTemplates = () => dataAccess.getAllLootTemplates();
export const getAllCreatures = () => dataAccess.getAllCreatures();
export const getTranslator = () => dataAccess.getTranslator();
export const getAllUpgradesData = () => dataAccess.getAllUpgradesData();
export const getAllPerks = () => dataAccess.getAllPerks();
export const getPerkByName = (name: string) => dataAccess.getPerkByName(name);
