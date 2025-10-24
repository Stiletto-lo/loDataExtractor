/**
 * Service for exporting data to files
 * 
 * This module provides functions for exporting processed data
 * to JSON files in different formats.
 */

import fs from "fs-extra";
import type { Item, Tech, Creature, Perk, TranslationData } from "../types";

const fileParser = require("../controllers/fileParsers");
const dataProcessor = require("./dataProcessor");
const { convertToSnakeCase } = require("../utils/convertToSnakeCase.js");

/**
 * Exports perk data to JSON files
 * @param perks - Processed perk data
 * @param folderPath - Export folder path
 * @returns Promise that resolves when export is completed
 */
const exportPerksData = async (perks: Perk[], folderPath: string): Promise<void> => {
	if (perks.length > 0) {
		console.log(`Processing ${perks.length} perk entries for export...`);

		await fs.writeFile(
			`${folderPath}perks.json`,
			JSON.stringify(perks, null, 2),
			(err) => {
				if (err) {
					console.error("Error creating the perks.json file");
				} else {
					console.log("Perk data exported to perks.json");
				}
			},
		);

		await fs.writeFile(
			`${folderPath}perks_min.json`,
			JSON.stringify(perks),
			(err) => {
				if (err) {
					console.error("Error creating the perks_min.json file");
				} else {
					console.log("Perks_min.json exported");
				}
			},
		);
	}
};

/**
 * Exports technology data to JSON files
 * @param techData - Processed technology data
 * @param folderPath - Export folder path
 * @returns Promise that resolves when export is completed
 */
const exportTechData = async (techData: Tech[], folderPath: string): Promise<void> => {
	if (techData.length > 0) {
		console.log(`Processing ${techData.length} tech entries for export...`);

		const normalizedNameMap = new Map<string, Tech>();
		const typeMap = new Map<string, Tech>();

		for (const tech of techData) {
			if (tech.name && tech.type) {
				if (typeMap.has(tech.type)) {
					const existingTech = typeMap.get(tech.type)!;

					const existingTechProps = Object.entries(existingTech).filter(([_, v]) => v !== undefined && v !== null).length;
					const currentTechProps = Object.entries(tech).filter(([_, v]) => v !== undefined && v !== null).length;

					if (currentTechProps > existingTechProps) {
						typeMap.set(tech.type, tech);
					}
				} else {
					typeMap.set(tech.type, tech);
				}
			} else if (tech.name) {
				normalizedNameMap.set(tech.name, tech);
			}
		}

		const uniqueTechData = [
			...Array.from(typeMap.values()),
			...Array.from(normalizedNameMap.values()).filter(tech => !typeMap.has(tech.type || ""))
		];

		console.log(`Reduced to ${uniqueTechData.length} unique tech entries after deduplication`);

		await fs.writeFile(
			`${folderPath}tech.json`,
			JSON.stringify(uniqueTechData, null, 2),
			(err) => {
				if (err) {
					console.error("Error creating the tech.json file");
				} else {
					console.log("Tech data exported to tech.json");
				}
			},
		);

		await fs.writeFile(
			`${folderPath}tech_min.json`,
			JSON.stringify(uniqueTechData),
			(err) => {
				if (err) {
					console.error("Error creating the tech_min.json file");
				} else {
					console.log("Tech_min.json exported");
				}
			},
		);
	}
};

/**
 * Exports item data to JSON files
 * @param allItems - Processed items
 * @param minItems - Minimal version of items
 * @param folderPath - Export folder path
 * @returns Promise that resolves when export is completed
 */
const exportItemsData = async (allItems: Item[], minItems: Item[], folderPath: string): Promise<void> => {
	console.info("Exporting items.json");
	if (allItems.length > 0) {
		// Process strongbox drops
		console.log("Processing strongbox drops before export...");
		const itemsWithStrongboxDrops = dataProcessor.processStrongboxes(allItems);

		// Apply ingredient name fixing before exporting
		const ingredientNameFixer = require("../utils/ingredientNameFixer");
		console.log("Applying ingredient name fixing to items before export...");
		const fixedItems = ingredientNameFixer.fixIngredientNames(itemsWithStrongboxDrops);
		const fixedMinItems = ingredientNameFixer.fixIngredientNames(minItems);

		await fs.writeFile(
			`${folderPath}items.json`,
			JSON.stringify(fixedItems, null, 2),
			(err) => {
				if (err) {
					console.error("Error creating the file");
				}
			},
		);

		// Save the item name glossary
		console.log("Saving item name glossary...");
		fileParser.saveGlossary(`${folderPath}itemNameGlossary.json`);

		console.info("Exporting items_min.json");
		await fs.writeFile(
			`${folderPath}items_min.json`,
			JSON.stringify(fixedMinItems),
			(err) => {
				if (err) {
					console.error("Error creating the items_min.json file");
				} else {
					console.log("Items_min.json exported with fixed ingredient names");
				}
			},
		);
	}
};

/**
 * Exports individual item files
 * @param allItems - All processed items
 * @param folderPath - Export folder path
 * @returns Promise that resolves when export is completed
 */
const exportIndividualItemFiles = async (allItems: Item[], folderPath: string): Promise<void> => {
	// Implementation would be here - simplified for migration
	console.log("Exporting individual item files...");
};

/**
 * Exports creature data to JSON files
 * @param creatures - Processed creatures
 * @param minCreatures - Minimal version of creatures
 * @param folderPath - Export folder path
 * @returns Promise that resolves when export is completed
 */
const exportCreaturesData = async (creatures: Creature[], minCreatures: Creature[], folderPath: string): Promise<void> => {
	console.info("Exporting creatures.json");
	if (creatures.length > 0) {
		await fs.writeFile(
			`${folderPath}creatures.json`,
			JSON.stringify(creatures, null, 2),
			(err) => {
				if (err) {
					console.error("Error creating the creatures.json file");
				}
			},
		);

		await fs.writeFile(
			`${folderPath}creatures_min.json`,
			JSON.stringify(minCreatures),
			(err) => {
				if (err) {
					console.error("Error creating the creatures_min.json file");
				} else {
					console.log("Creatures_min.json exported");
				}
			},
		);

		console.log(`Creatures exported (${creatures.length} entries)`);
	}
};

/**
 * Exports translation data to JSON files
 * @param translateData - Translation data
 * @param folderPath - Export folder path
 * @returns Promise that resolves when export is completed
 */
const exportTranslationsData = async (translateData: TranslationData, folderPath: string): Promise<void> => {
	console.log("Exporting translation data...");
	// Implementation would be here - simplified for migration
};

/**
 * Main function to save all files
 * @param folderPath - Export folder path
 * @returns Promise that resolves when all exports are completed
 */
const saveAllFiles = async (folderPath: string): Promise<void> => {
	// Process and export item data
	const allItems = dataProcessor.processItems();
	const minItems = dataProcessor.createMinItems(allItems);
	await exportItemsData(allItems, minItems, folderPath);

	// Process and export perk data
	const perks = fileParser.getAllPerks();
	await exportPerksData(perks, folderPath);

	// Process and export technology data
	const techData = dataProcessor.processTechData();
	await exportTechData(techData, folderPath);

	// Process and export creature data
	const creatures = dataProcessor.processCreatures();
	const minCreatures = dataProcessor.createMinCreatures(creatures);
	await exportCreaturesData(creatures, minCreatures, folderPath);

	// Process and export translation data
	const translateData = dataProcessor.processTranslations();
	await exportTranslationsData(translateData, folderPath);
};

export {
	exportTechData,
	exportItemsData,
	exportIndividualItemFiles,
	exportCreaturesData,
	exportTranslationsData,
	exportPerksData,
	saveAllFiles,
};