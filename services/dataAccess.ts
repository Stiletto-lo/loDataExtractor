import type { Item, Tech, LootTable, LootTemplate, Creature, Perk, Translator } from "../types";

const fileParser = require("../controllers/fileParsers");

class DataAccess {
	private initialized: boolean = false;

	constructor() {
		this.initialized = false;
	}

	initialize(): void {
		if (this.initialized) {
			return;
		}
		this.initialized = true;
	}

	getAllItems(): Item[] {
		return fileParser.getAllItems();
	}

	getItemByName(name: string): Item | undefined {
		return fileParser.getItem(name);
	}

	getItemByType(type: string): Item[] {
		return fileParser.getItemByType(type);
	}

	getAllTechData(): Tech[] {
		return fileParser.getTechData();
	}

	getAllLootTables(): LootTable[] {
		return fileParser.getAllLootTables();
	}

	getAllLootTemplates(): LootTemplate[] {
		return fileParser.getAllLootTemplates();
	}

	getAllCreatures(): Creature[] {
		return fileParser.getCreatures();
	}

	getTranslator(): Translator {
		return fileParser.getTranslator();
	}

	getAllUpgradesData(): any[] {
		return fileParser.getUpgradesData();
	}

	getAllPerks(): Perk[] {
		return fileParser.getAllPerks();
	}

	getPerkByName(name: string): Perk | undefined {
		return fileParser.getPerkByName(name);
	}
}

const dataAccess = new DataAccess();

export default dataAccess;