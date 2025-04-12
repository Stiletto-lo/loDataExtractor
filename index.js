require("dotenv").config();
const fs = require("fs-extra");
const comparator = require("./controllers/comparator");
const fileParser = require("./controllers/fileParsers");
const dataParser = require("./controllers/dataParsers");

let allItems = [];
const SHOW_DEV_ITEMS = process.env.SHOW_DEV_ITEMS === "true";
const CONTENT_FOLDER_PATH = process.env.CONTENT_FOLDER_PATH
	? process.env.CONTENT_FOLDER_PATH
	: "./";

const folderPatch = "./exported/";

const orderByCategoryAndName = (a, b) => {
	if (a.category < b.category) {
		return -1;
	}

	if (a.category > b.category) {
		return 1;
	}

	if (a.name < b.name) {
		return -1;
	}

	if (a.name > b.name) {
		return 1;
	}

	return 0;
};

const orderByName = (a, b) => {
	if (a.name < b.name) {
		return -1;
	}

	if (a.name > b.name) {
		return 1;
	}
	return 0;
};

const loadFiles = () => {
	console.info("Loading StringTables");
	loadDirData(
		`${CONTENT_FOLDER_PATH}Content/Mist/Data/StringTables`,
		"stringtables",
	);
	console.info("Loading Localization");
	loadDirData(
		`${CONTENT_FOLDER_PATH}Content/Localization/Game/en`,
		"translation",
	);
	loadDirData(
		`${CONTENT_FOLDER_PATH}Content/Localization/Game`,
		"translationOthers",
	);
	console.info("Loading Loot sites");
	loadDirData(
		`${CONTENT_FOLDER_PATH}Content/Mist/Characters/Creatures/Monkey`,
		"lootsites",
	);
	loadDirData(
		`${CONTENT_FOLDER_PATH}Content/Mist/Characters/Creatures/Okkam`,
		"lootsites",
	);
	loadDirData(
		`${CONTENT_FOLDER_PATH}Content/Mist/Characters/Creatures/Papak`,
		"lootsites",
	);
	console.info("Loading TechTree");
	loadDirData(`${CONTENT_FOLDER_PATH}Content/Mist/Data/TechTree`, "tech");
	console.info("Loading Items");
	loadDirData(`${CONTENT_FOLDER_PATH}Content/Mist/Data/Items`, "item");
	console.info("Loading Placeables");
	loadDirData(
		`${CONTENT_FOLDER_PATH}Content/Mist/Data/Placeables`,
		"placeables",
	);
	console.info("Loading Recipes");
	loadDirData(`${CONTENT_FOLDER_PATH}Content/Mist/Data/TechTree`, "item");
	console.info("Loading Trade");
	loadDirData(`${CONTENT_FOLDER_PATH}Content/Mist/Data/Trade`, "trade");
	console.info("Loading Placeables Cached");
	loadDirData(`${CONTENT_FOLDER_PATH}Content/Mist/Data/Placeables`, "item");
	console.info("Loading Walkers Upgrades");
	loadDirData(`${CONTENT_FOLDER_PATH}Content/Mist/Data/Walkers`, "upgrages");
	console.info("Loading Damages");
	loadDirData(
		`${CONTENT_FOLDER_PATH}Content/Mist/Data/DamageTypes`,
		"damagetypes",
	);
	console.info("Loading Schematics");
	loadDirData(
		`${CONTENT_FOLDER_PATH}Content/Mist/Data/Items/Schematics`,
		"schematics",
	);

	console.info("Building Item Name Glossary");
	fileParser.buildItemNameGlossary(
		`${CONTENT_FOLDER_PATH}Content/Mist/Data/Items`,
	);

	if (process.env.EXTRACT_LOOT_TABLES === "true") {
		console.info("Loading LootTables");
		loadDirData(
			`${CONTENT_FOLDER_PATH}Content/Mist/Data/LootTables`,
			"loottables",
		);
		loadDirData(
			`${CONTENT_FOLDER_PATH}Content/Mist/Data/LootTables`,
			"blueprintsloot",
		);
		fileParser.parseBlueprintsToItems();
	}
};

loadFiles();

console.info("Parse Upgrades to Items");
fileParser.parseUpgradesToItems();

allItems = fileParser.getAllItems();

const translator = fileParser.getTranslator();

if (!SHOW_DEV_ITEMS) {
	allItems = allItems.filter((item) => !item.onlyDevs);
}

console.info("Translating the items");
allItems = translator.addDescriptions(allItems);
allItems = translator.translateItems(allItems);

for (const item of allItems) {
	for (const key of Object.keys(item)) {
		if (item[key] === undefined) {
			delete item[key];
		}
		if (item?.drops !== undefined && item.drops.length <= 0) {
			item.drops = undefined;
		}
		if (item?.toolInfo !== undefined && item.toolInfo.length <= 0) {
			item.toolInfo = undefined;
		}
	}
}

allItems = allItems
	.map((item) => {
		const countItems = allItems.filter((item2) => item.name === item2.name);
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
		}

		return acc;
	}, []);

// Extract tech data from fileParser
let techData = fileParser.getTechData();

// Process tech data similar to items
techData = techData
	.map((tech) => {
		const countTech = techData.filter((tech2) => tech.name === tech2.name);
		if (countTech.length > 1) {
			return { ...countTech[0], ...countTech[1] };
		}
		return tech;
	})
	.filter((tech) => tech.name && Object.keys(tech).length > 2)
	.reduce((acc, current) => {
		const x = acc.find((tech) => tech.name === current.name);
		if (!x) {
			return acc.concat([current]);
		}
		return acc;
	}, []);

// Sort tech data by name
techData.sort(orderByName);

// Export tech data to tech.json
if (techData.length > 0) {
	fs.writeFile(
		`${folderPatch}tech.json`,
		JSON.stringify(techData, null, 2),
		(err) => {
			if (err) {
				console.error("Error creating the tech.json file");
			} else {
				console.log("Tech data exported to tech.json");
			}
		},
	);

	fs.writeFile(
		`${folderPatch}tech_min.json`,
		JSON.stringify(techData),
		(err) => {
			if (err) {
				console.error("Error creating the tech_min.json file");
			} else {
				console.log("Tech_min.json exported");
			}
		},
	);
}

allItems = dataParser.itemMerger(allItems, "Long Sawblade", "Sawblade_Tier2");

allItems.sort(orderByName);

if (allItems.length > 0) {
	fs.writeFile(
		`${folderPatch}items.json`,
		JSON.stringify(allItems, null, 2),
		(err) => {
			if (err) {
				console.error("Error creating the file");
			} else {
				console.log("Items exported");

				// Run the tech tree item unifier to fix inconsistencies
				const { unifyTechTreeAndItems } = require('./utils/techTreeItemUnifier');
				console.log("Running tech tree item unifier...");
				const unifyResult = unifyTechTreeAndItems(`${folderPatch}items.json`);
				if (unifyResult.success) {
					console.log(`Tech tree unification complete. Fixed ${unifyResult.fixedCount} learn entries.`);
				} else {
					console.error(`Tech tree unification failed: ${unifyResult.error}`);
				}

				// Reload the items after unification
				allItems = JSON.parse(fs.readFileSync(`${folderPatch}items.json`, 'utf8'));
			}
		},
	);

	// Save the item name glossary
	fileParser.saveGlossary(`${folderPatch}itemNameGlossary.json`);

	for (const item of allItems) {
		for (const key of Object.keys(item)) {
			if (item[key] === undefined) {
				delete item[key];
			}
		}

		if (item?.translation !== undefined) {
			item.translation = undefined;
		}
		if (item?.type !== undefined) {
			item.type = undefined;
		}
		if (item?.schematicName !== undefined) {
			item.schematicName = undefined;
		}
		if (item?.damageType !== undefined) {
			item.damageType = undefined;
		}
		if (item?.learn && item.learn.length === 0) {
			item.learn = undefined;
		}
	}

	// Create items_min.json with only category, name, crafting and projectileDamage
	const minItems = allItems.map(item => {
		const minItem = {};
		// Only include the required fields
		if (item.category) {
			minItem.category = item.category;
		}
		if (item.name) {
			minItem.name = item.name;
		}
		if (item.crafting) {
			minItem.crafting = item.crafting;
		}
		if (item.projectileDamage) {
			minItem.projectileDamage = item.projectileDamage;
		}
		return minItem;
	});

	minItems.sort(orderByCategoryAndName);
	fs.writeFile(
		`${folderPatch}items_min.json`,
		JSON.stringify(minItems),
		(err) => {
			if (err) {
				console.error("Error creating the items_min.json file");
			} else {
				console.log("Items_min.json exported");
			}
		},
	);

	// Create individual JSON files for each item
	const itemsFolder = `${folderPatch}items`;
	fs.ensureDirSync(itemsFolder);

	for (const item of allItems) {
		if (item.name) {
			// Convert item name to snake_case and make it safe for filenames
			const snakeCaseName = item.name
				.toLowerCase()
				.replace(/\s+/g, '_')     // Replace spaces with underscores
				.replace(/[^a-z0-9_]/g, '') // Remove any non-alphanumeric characters except underscores
				.replace(/_+/g, '_');       // Replace multiple underscores with a single one

			fs.writeFile(
				`${itemsFolder}/${snakeCaseName}.json`,
				JSON.stringify(item, null, 2),
				(err) => {
					if (err) {
						console.error(`Error creating individual file for ${item.name}`);
					}
				},
			);
		}
	}
	console.log("Individual item JSON files exported");
}

let creatures = fileParser.getCreatures();

for (const creature of creatures) {
	for (const key of Object.keys(creature)) {
		if (creature[key] === undefined) {
			delete creature[key];
		}
	}
}

creatures = creatures.filter(
	(item) => item.name && Object.keys(item).length > 2,
);

creatures.sort(orderByName);
if (creatures.length > 0) {
	fs.writeFile(
		`${folderPatch}creatures.json`,
		JSON.stringify(creatures, null, 2),
		(err) => {
			if (err) {
				console.error("Error creating the file");
			} else {
				console.log("Creatures exported");
			}
		},
	);

	for (const creature of creatures) {
		for (const key of Object.keys(creature)) {
			if (creature[key] === undefined) {
				delete creature[key];
			}
			if (creature?.lootTable !== undefined) {
				creature.lootTable = undefined;
			}
			if (creature?.type !== undefined) {
				creature.type = undefined;
			}
		}
	}

	fs.writeFile(
		`${folderPatch}creatures_min.json`,
		JSON.stringify(creatures),
		(err) => {
			if (err) {
				console.error("Error creating the file");
			} else {
				console.log("Creatures.min exported");
			}
		},
	);
}

if (process.env.TRANSLATE_FILES === "true") {
	// Add all item names and other translatable fields to the translationsInUse store
	console.log("Adding all item translations to the translationsInUse store...");
	let translationCount = 0;
	for (const item of allItems) {
		if (item.name) {
			translator.addTranslationInUse(item.name, item.name);
			translationCount++;
		}
		if (item.name && item.translation) {
			translator.addTranslationInUse(item.name, item.translation);
			translationCount++;
		}

		if (item.type && item.name) {
			translator.addTranslationInUse(item.type, item.name);
			translationCount++;
		}

		if (item.description) {
			translator.addTranslationInUse(item.description, item.description);
			translationCount++;
		}
	}
	console.log(
		`Added ${translationCount} item translations to the translationsInUse store`,
	);

	// Export the translations
	const translateData = translator.getTranslateFiles();
	console.log(
		`Found ${Object.keys(translateData).length} languages with translations`,
	);

	for (const languaje in translateData) {
		const fileData = translateData[languaje];
		const languajeArray = languaje.split("-");
		fs.outputFile(
			`${folderPatch}locales/${languajeArray[0].toLowerCase()}/items.json`,
			JSON.stringify(fileData, null, 2),
			(err) => {
				if (err) {
					console.error(`Error creating the file: ${languaje}`, err);
				} else {
					console.log(
						`Translated files ${languaje} exported with ${Object.keys(fileData).length} translations`,
					);
				}
			},
		);
	}
}

if (process.env.COMPARE === "true") {
	comparator.compareItems(allItems, folderPatch);
}

function loadDirData(techTreeDir, folderType) {
	if (!fs.exists(techTreeDir)) {
		return;
	}

	let files = [];

	try {
		files = fs.readdirSync(techTreeDir);
	} catch (error) {
		console.error(`The folder ${techTreeDir} not exists`);
	}

	for (const file of files) {
		const path = `${techTreeDir}/${file}`;

		const fileData = fs.statSync(path);
		if (fileData.isDirectory()) {
			loadDirData(path, folderType);
		} else if (file.includes(".json")) {
			switch (folderType) {
				case "tech":
					fileParser.parseTechData(path);
					break;
				case "item":
					fileParser.parseItemData(path);
					break;
				case "stringtables":
					fileParser.parseStringTables(path);
					break;
				case "trade":
					fileParser.parsePrices(path);
					break;
				case "placeables":
					fileParser.parsePlaceableData(path);
					break;
				case "cached":
					if (file.includes("CachedPlaceablesCosts.json")) {
						fileParser.parseCachedItems(path);
					}
					break;
				case "loottables":
					fileParser.parseLootTable(path);
					break;
				case "upgrages":
					fileParser.parseUpgrades(path);
					break;
				case "blueprintsloot":
					fileParser.parseLootBlueprint(path);
					break;
				case "damagetypes":
					fileParser.parseDamage(path);
					break;
				case "schematics":
					fileParser.parseSchematicItemData(path);
					break;
				case "translation":
					fileParser.parseTranslations(path);
					break;
				case "translationOthers":
					fileParser.parseOtherTranslations(path);
					break;
				case "lootsites":
					fileParser.parseLootSites(path);
					break;
			}
		}
	}
}
