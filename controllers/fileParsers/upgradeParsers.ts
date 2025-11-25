/**
 * Upgrade parsers for handling upgrade-related data
 *
 * This module provides functions for parsing and extracting upgrade information
 * from game data files. It handles upgrade properties, recipes, and relationships
 * between upgrades.
 */

import * as dataParser from "../dataParsers";
import * as translator from "../translator";
import type { Upgrade } from "../../templates/upgrade";
import type { UpgradeInfo } from "../../templates/upgradeInfo";
import type { Recipe } from "../../templates/recipe";
import * as utilityFunctions from "./utilityFunctions";
import { itemTemplate } from "../../templates/item";
import { readJsonFile } from "../utils/read-json-file";

// Property mapping from source data to our internal model
const PROPERTY_MAPPING = {
	ContainerSlots: "slots",
	EngineTorqueMultiplier: "engineTorqueMultiplier",
	SprintingTorqueDiscount: "sprintingTorqueDiscount",
	AdditionalParts: "additionalParts",
	AdditionalSlots: "additionalSlots",
	StackSizeOverride: "stackSize",
	BonusHp: "bonusHp",
};

/**
 * Extract upgrade information from properties
 * @param {Object} properties - The upgrade properties
 * @param {string} key - The current upgrade key
 * @returns {Object} The extracted upgrade info and its validity status
 */
const extractUpgradeInfo = (
	properties: any,
	key: string,
): {
	upgradeInfo: UpgradeInfo;
	isValid: boolean;
} => {
	if (!properties || typeof properties !== "object") {
		return { upgradeInfo: {} as UpgradeInfo, isValid: false };
	}

	const upgradeInfo = {} as UpgradeInfo;
	const propertyData = properties[key] || {};
	let isValid = false;

	// Extract properties using the mapping
	try {
		for (const [sourceKey, targetKey] of Object.entries(PROPERTY_MAPPING)) {
			if (propertyData[sourceKey] !== undefined) {
				//@ts-expect-error fix later
				upgradeInfo[targetKey] = propertyData[sourceKey];
				isValid = true;
			}
		}
	} catch (error) {
		console.error(`Error extracting upgrade properties for ${key}:`, error);
	}

	return { upgradeInfo, isValid };
};

/**
 * Extract recipe data from upgrade properties
 * @param {Object} properties - The upgrade properties
 * @param {string} key - The current upgrade key
 * @returns {Object|null} The recipe object or null if no recipe data
 */
const extractRecipeData = (properties: any, key: string) => {
	if (!properties || typeof properties !== "object") {
		return null;
	}

	const propertyData = properties[key] || {};

	if (!propertyData.Inputs || typeof propertyData.Inputs !== "object") {
		return null;
	}

	const recipe: Recipe = {};
	const ingredients = [];

	try {
		// Extract ingredients
		for (const inputKey of Object.keys(propertyData.Inputs)) {
			try {
				const ingredient = utilityFunctions.getIngredientsFromItem(
					propertyData.Inputs,
					inputKey,
				);
				if (ingredient) {
					ingredients.push(ingredient);
				}
			} catch (ingredientError) {
				console.error(
					`Error extracting ingredient for ${inputKey}:`,
					ingredientError,
				);
			}
		}

		if (ingredients.length > 0) {
			recipe.ingredients = ingredients;
		}

		// Add crafting time if available
		if (propertyData.CraftingTime) {
			recipe.time = propertyData.CraftingTime;
		}

		return recipe;
	} catch (error) {
		console.error(`Error extracting recipe data for ${key}:`, error);
		return null;
	}
};

/**
 * Process a single upgrade entry
 * @param {Object} jsonData - The parsed JSON data
 * @param {string} key - The current upgrade key
 * @param {string} profile - The profile name
 * @param {string|undefined} superUp - The super upgrade name
 * @returns {boolean} Whether the upgrade was processed successfully
 */
const processUpgradeEntry = (
	jsonData: any,
	key: string,
	profile?: string,
	superUp?: string,
): boolean => {
	if (!jsonData || !key) {
		return false;
	}

	try {
		const properties = jsonData[1]?.Properties || {};
		const propertyData = properties[key] || {};

		// Skip disabled upgrades
		const isEnabled =
			propertyData.bIsEnabled !== undefined ? propertyData.bIsEnabled : true;
		if (!isEnabled) return false;

		// Create upgrade object
		const upgrade: Upgrade = {};

		const parsedName = dataParser.parseName(translator, key);
		if (profile !== undefined) {
			upgrade.profile = profile;
		}
		if (superUp !== undefined) {
			upgrade.super = superUp;
		}
		if (parsedName !== undefined) {
			upgrade.name = parsedName;
		}

		// Extract upgrade info
		const { upgradeInfo, isValid } = extractUpgradeInfo(properties, key);
		if (isValid) {
			upgrade.upgradeInfo = upgradeInfo;
		}

		// Extract recipe data
		const recipe = extractRecipeData(properties, key);
		if (recipe) {
			upgrade.crafting = [recipe];
		}

		// Add to upgrades data
		utilityFunctions.getUpgradesData().push(upgrade);
		return true;
	} catch (error) {
		console.error(`Error processing upgrade entry ${key}:`, error);
		return false;
	}
};

/**
 * Parse upgrades data from a file
 * @param {string} filePath - The file path to parse
 * @returns {boolean} Whether the parsing was successful
 */
export const parseUpgrades = (filePath: string) => {
	if (!filePath || typeof filePath !== "string") {
		console.error("Invalid file path provided to parseUpgrades");
		return false;
	}

	try {
		// Read and parse the file
		const jsonData = readJsonFile(filePath, "utf8");

		if (!jsonData[0]?.Name) {
			console.warn(`No Name property found in ${filePath}`);
			return false;
		}

		// Extract profile and super upgrade information
		const profile = dataParser.parseName(translator, jsonData[0].Name);
		// FIX: Don't parse the Super field with parseName, keep the original object/string
		const superUp = jsonData[0].Super ?? undefined;

		// Process each upgrade entry
		if (jsonData[1]?.Properties) {
			const upgradeKeys = Object.keys(jsonData[1].Properties).filter((key) =>
				key.includes("Upgrade"),
			);

			if (upgradeKeys.length === 0) {
				return false;
			}

			for (const key of upgradeKeys) {
				processUpgradeEntry(jsonData, key, profile, superUp);
			}
			return true;
		}
	} catch (error) {
		console.error(`Error parsing upgrades from ${filePath}:`, error);
		return false;
	}
};

export const getUpgradeItem = (upgradePure: any) => {
	if (upgradePure?.super) {
		// Extract the actual profile name from the super object
		let superProfileName = upgradePure.super;
		if (typeof upgradePure.super === "object" && upgradePure.super !== null) {
			// If super is an object, try to extract the profile name
			if (upgradePure.super.ObjectName) {
				// Parse the ObjectName to get the clean profile name
				superProfileName = dataParser.parseName(
					translator,
					upgradePure.super.ObjectName,
				);
			} else if (upgradePure.super.profile) {
				superProfileName = upgradePure.super.profile;
			} else if (upgradePure.super.name) {
				superProfileName = upgradePure.super.name;
			} else {
				for (const [key, value] of Object.entries(upgradePure.super)) {
					if (typeof value === "string" && value.includes("Profile")) {
						superProfileName = dataParser.parseName(translator, value);
						break;
					}
				}
			}
		} else if (typeof upgradePure.super === "string") {
			// If it's already a string, parse it
			superProfileName = dataParser.parseName(translator, upgradePure.super);
		}

		const superUpgrade = utilityFunctions
			.getUpgradesData()
			.find(
				(up) => up.profile === superProfileName && up.name === upgradePure.name,
			);

		// Handle inheritance - if super upgrade exists, merge data
		if (superUpgrade) {
			const superUpgradeData = getUpgradeItem(superUpgrade);

			const item = { ...itemTemplate };
			item.category = "Upgrades";
			item.name = dataParser.parseUpgradeName(
				upgradePure?.name,
				upgradePure?.profile,
			);

			item.upgradeInfo = {
				...(superUpgradeData?.upgradeInfo || {}),
				...upgradePure.upgradeInfo,
			};

			// Handle crafting data inheritance
			if (upgradePure.crafting && superUpgradeData?.crafting) {
				// Both child and super have crafting data - merge them
				const recipe: Recipe = {};
				if (upgradePure.crafting[0].time) {
					recipe.time = upgradePure.crafting[0].time;
				} else if (superUpgradeData.crafting[0].time) {
					recipe.time = superUpgradeData.crafting[0].time;
				}

				if (
					upgradePure.crafting[0].ingredients &&
					superUpgradeData.crafting[0].ingredients
				) {
					const ingredientsFiltered =
						superUpgradeData.crafting[0].ingredients.filter(
							(ingredient: { name?: string }) =>
								!upgradePure.crafting[0].ingredients.some(
									(i: { name?: string }) => i.name === ingredient.name,
								),
						);
					recipe.ingredients = [].concat(
						upgradePure.crafting[0].ingredients,
						ingredientsFiltered,
					);
				} else if (upgradePure.crafting[0].ingredients) {
					recipe.ingredients = upgradePure.crafting[0].ingredients;
				} else if (superUpgradeData.crafting[0].ingredients) {
					recipe.ingredients = superUpgradeData.crafting[0].ingredients;
				}
				item.crafting = [recipe];
			} else if (upgradePure.crafting) {
				// Only child has crafting data
				item.crafting = upgradePure.crafting;
			} else if (superUpgradeData?.crafting) {
				// Only super has crafting data
				item.crafting = superUpgradeData.crafting;
			}
			// If neither has crafting data, item.crafting remains undefined

			if (!item.type) {
				item.type = item.name;
			}

			return item;
		}

		const item = { ...itemTemplate };
		item.category = "Upgrades";
		item.name = dataParser.parseUpgradeName(
			upgradePure?.name,
			upgradePure?.profile,
		);
		item.upgradeInfo = upgradePure?.upgradeInfo;
		item.crafting = upgradePure?.crafting;

		if (!item.type) {
			item.type = item.name;
		}

		return item;
	}

	const item = { ...itemTemplate };
	item.category = "Upgrades";
	item.name = dataParser.parseUpgradeName(
		upgradePure?.name,
		upgradePure?.profile,
	);
	item.upgradeInfo = upgradePure?.upgradeInfo;
	item.crafting = upgradePure?.crafting;

	return item;
};

export const parseUpgradesToItems = () => {
	for (const upgradePure of utilityFunctions.getUpgradesData()) {
		const item = getUpgradeItem(upgradePure);
		if (item?.name) {
			utilityFunctions.addItem(item);
		}
	}
};

export const _internal = {
	extractUpgradeInfo,
	extractRecipeData,
	processUpgradeEntry,
};
