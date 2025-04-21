require("dotenv").config();
const fs = require("fs-extra");
const fileParser = require("./controllers/fileParsers");

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

const loadDirData = (dir, type) => {
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
				case "upgrages":
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
				case "blueprintsloot":
					fileParser.parseLootBlueprint(filePath);
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
				default:
					break;
			}
		}
	}
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
		`${CONTENT_FOLDER_PATH}Content/Mist/Characters/Creatures`,
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
			`${CONTENT_FOLDER_PATH}Content/Mist/Data/LootTables/LootTables`,
			"loottables",
		);
		loadDirData(
			`${CONTENT_FOLDER_PATH}Content/Mist/Data/LootTables`,
			"blueprintsloot",
		);
		console.info("Loading LootTemplates");
		loadDirData(
			`${CONTENT_FOLDER_PATH}Content/Mist/Data/LootTables/LootTemplates`,
			"loottemplates",
		);
		fileParser.parseBlueprintsToItems();
	}
};

const saveFiles = async () => {
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

	console.info("Cleaning up the items");
	for (const item of allItems) {
		for (const key of Object.keys(item)) {
			if (item[key] === undefined) {
				delete item[key];
			}
		}

		if (item?.drops !== undefined && item.drops.length <= 0) {
			item.drops = undefined;
		}
		if (item?.toolInfo !== undefined && item.toolInfo.length <= 0) {
			item.toolInfo = undefined;
		}

		if (item?.learn && item.learn.length === 0) {
			item.learn = undefined;
		}
	}

	console.info("Items: Removing duplicates");
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

	console.info("Extracting tech data from fileParser");
	let techData = fileParser.getTechData();

	console.info("Tech: Removing duplicates");
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

	if (techData.length > 0) {
		await fs.writeFile(
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

		await fs.writeFile(
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

	allItems.sort(orderByName);

	console.info("Exporting items.json");
	if (allItems.length > 0) {
		await fs.writeFile(
			`${folderPatch}items.json`,
			JSON.stringify(allItems, null, 2),
			(err) => {
				if (err) {
					console.error("Error creating the file");
				} else {
					console.log("Items exported");

					// Run the tech tree item unifier to fix inconsistencies
					const {
						unifyTechTreeAndItems,
					} = require("./utils/techTreeItemUnifier");
					console.log("Running tech tree item unifier...");
					const unifyResult = unifyTechTreeAndItems(`${folderPatch}items.json`);
					if (unifyResult.success) {
						console.log(
							`Tech tree unification complete. Fixed ${unifyResult.fixedCount} learn entries.`,
						);
					} else {
						console.error(`Tech tree unification failed: ${unifyResult.error}`);
					}

					// Reload the items after unification
					allItems = JSON.parse(
						fs.readFileSync(`${folderPatch}items.json`, "utf8"),
					);
				}
			},
		);

		// Save the item name glossary
		console.log("Saving item name glossary...");
		fileParser.saveGlossary(`${folderPatch}itemNameGlossary.json`);

		let minItems = allItems.map((item) => {
			const essentialFields = [
				"category",
				"name",
				"trade_price",
				"experiencieReward",
				"stackSize",
				"weight",
				"durability",
				"parent",
				"learn",
				"crafting",
				"station",
				"time",
				"ingredients",
				"projectileDamage",
				"damage",
				"effectivenessVsSoak",
				"effectivenessVsReduce",
				"structureInfo",
				"hp",
				"moduleInfo",
				"max",
				"increase",
				"weaponInfo",
				"weaponLength",
				"penetration",
				"description",
			];
			const minItem = {};

			for (const key of essentialFields) {
				if (item[key]) {
					minItem[key] = item[key];
				}
			}

			if (item?.drops?.length > 0) {
				minItem.drops = item.drops.map((drop) => {
					return {
						location: drop.location,
					};
				});
			}

			return minItem;
		});

		minItems = minItems.filter((item) => item.name && Object.keys(item).length > 2);

		minItems.sort(orderByCategoryAndName);

		console.info("Exporting items_min.json");
		await fs.writeFile(
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
					.replace(/\s+/g, "_") // Replace spaces with underscores
					.replace(/[^a-z0-9_]/g, "") // Remove any non-alphanumeric characters except underscores
					.replace(/_+/g, "_"); // Replace multiple underscores with a single one

				await fs.writeFile(
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

	// Get creatures and process them with enhanced data
	console.info("Processing creatures with enhanced data");
	const creatureProcessor = require("./utils/creatureProcessor");
	let creatures = fileParser.getCreatures();
	const lootTables =
		process.env.EXTRACT_LOOT_TABLES === "true"
			? fileParser.getAllLootTables()
			: {};

	// Process creatures with enhanced data
	creatures = creatureProcessor.processCreatures(
		creatures,
		translator,
		lootTables,
	);

	// Sort creatures by name
	creatures.sort(orderByName);

	if (creatures.length > 0) {
		// Export main creatures.json file
		await fs.writeFile(
			`${folderPatch}creatures.json`,
			JSON.stringify(creatures, null, 2),
			(err) => {
				if (err) {
					console.error("Error creating the creatures.json file");
				} else {
					console.log(`Creatures exported (${creatures.length} entries)`);
				}
			},
		);

		// Create a minimal version for creatures_min.json
		const minCreatures = creatures.map((creature) => {
			const minCreature = {};
			// Only include essential fields
			if (creature.name) minCreature.name = creature.name;
			if (creature.category) minCreature.category = creature.category;
			if (creature.tier) minCreature.tier = creature.tier;
			if (creature.health) minCreature.health = creature.health;
			if (creature.experiencie) minCreature.experiencie = creature.experiencie;
			if (creature.dropQuantity)
				minCreature.dropQuantity = creature.dropQuantity;
			return minCreature;
		});

		await fs.writeFile(
			`${folderPatch}creatures_min.json`,
			JSON.stringify(minCreatures),
			(err) => {
				if (err) {
					console.error("Error creating the creatures_min.json file");
				} else {
					console.log("Creatures_min.json exported");
				}
			},
		);

		// Export individual creature files
		await creatureProcessor.exportIndividualCreatureFiles(
			creatures,
			folderPatch,
		);
	}
};

loadFiles();
saveFiles();

if (process.env.TRANSLATE_FILES === "true") {
	// Get the translator instance from fileParser
	const translator = fileParser.getTranslator();

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

		// The translator module now handles validation internally, but we'll do a final check
		// to ensure the JSON will be valid before writing to file
		const validatedData = {};
		let skippedEntries = 0;

		// Process each key-value pair to ensure valid JSON
		for (const [key, value] of Object.entries(fileData)) {
			// Skip entries with invalid keys or values
			if (
				!key ||
				typeof key !== "string" ||
				!value ||
				typeof value !== "string"
			) {
				skippedEntries++;
				continue;
			}

			try {
				// Test if the key and value can be properly serialized in JSON
				JSON.parse(JSON.stringify({ [key]: value }));
				validatedData[key] = value;
			} catch (error) {
				// If JSON serialization fails, skip this entry
				console.warn(
					`Skipping invalid translation entry for key: ${key.substring(0, 30)}...`,
				);
				skippedEntries++;
			}
		}

		if (skippedEntries > 0) {
			console.warn(
				`Skipped ${skippedEntries} invalid entries for language ${languaje}`,
			);
		}

		// Ensure the directory exists before writing
		const outputDir = `${folderPatch}locales/${languajeArray[0].toLowerCase()}`;
		fs.ensureDirSync(outputDir);

		fs.outputFile(
			`${folderPatch}locales/${languajeArray[0].toLowerCase()}/items.json`,
			JSON.stringify(validatedData, null, 2),
			(err) => {
				if (err) {
					console.error(`Error creating the file: ${languaje}`, err);
				} else {
					console.log(
						`Translated files ${languaje} exported with ${Object.keys(validatedData).length} translations`,
					);
				}
			},
		);
	}
}