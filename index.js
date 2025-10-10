require("dotenv").config();
const fs = require("fs-extra");

const fileLoader = require("./services/fileLoader");
const fileExporter = require("./services/fileExporter");
const dataAccess = require("./services/dataAccess");

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

extractData().catch(error => {
	console.error("Error during data extraction:", error);
	process.exit(1);
});

module.exports = {
	getAllItems: () => dataAccess.getAllItems(),
	getItemByName: (name) => dataAccess.getItemByName(name),
	getItemByType: (type) => dataAccess.getItemByType(type),
	getAllTechData: () => dataAccess.getAllTechData(),
	getAllLootTables: () => dataAccess.getAllLootTables(),
	getAllLootTemplates: () => dataAccess.getAllLootTemplates(),
	getAllCreatures: () => dataAccess.getAllCreatures(),
	getTranslator: () => dataAccess.getTranslator(),
	getAllUpgradesData: () => dataAccess.getAllUpgradesData(),
	getAllPerks: () => dataAccess.getAllPerks(),
	getPerkByName: (name) => dataAccess.getPerkByName(name),
	getPerksByAbility: (ability) => dataAccess.getPerksByAbility(ability),
};

