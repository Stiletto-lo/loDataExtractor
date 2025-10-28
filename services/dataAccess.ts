

import * as fileParser from "../controllers/fileParsers";

class DataAccess {
	initialized: boolean;
	constructor() {
		this.initialized = false;
	}

	initialize() {
		if (this.initialized) {
			return;
		}
		this.initialized = true;
	}

	getAllItems() {
		return fileParser.getAllItems();
	}

	getItemByName(name: string) {
		return fileParser.getItem(name);
	}

	getItemByType(type: string) {
		return fileParser.getItemByType(type);
	}

	getAllTechData() {
		return fileParser.getTechData();
	}

	getAllLootTables() {
		return fileParser.getAllLootTables();
	}

	getAllLootTemplates() {
		return fileParser.getAllLootTemplates();
	}

	getAllCreatures() {
		return fileParser.getCreatures();
	}

	getTranslator() {
		return fileParser.getTranslator();
	}

	getAllUpgradesData() {
		return fileParser.getUpgradesData();
	}

	getAllPerks() {
		return fileParser.getAllPerks();
	}

	getPerkByName(name: string) {
		return fileParser.getPerkByName(name);
	}
}

const dataAccess = new DataAccess();

export default dataAccess;