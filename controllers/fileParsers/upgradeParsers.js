/**
 * Upgrade parsers for handling upgrade-related data
 *
 * This module provides functions for parsing and extracting upgrade information
 * from game data files. It handles upgrade properties, recipes, and relationships
 * between upgrades.
 */

const fs = require("node:fs");
const dataParser = require("../dataParsers");
const translator = require("../translator");
const upgradeTemplate = require("../../templates/upgrade");
const upgradeInfoTemplate = require("../../templates/upgradeInfo");
const recipeTemplate = require("../../templates/recipe");
const utilityFunctions = require("./utilityFunctions");
const itemTemplate = require("../../templates/item");

// Property mapping from source data to our internal model
const PROPERTY_MAPPING = {
	ContainerSlots: "containerSlots",
	EngineTorqueMultiplier: "engineTorqueMultiplier",
	SprintingTorqueDiscount: "sprintingTorqueDiscount",
	AdditionalParts: "additionalParts",
	AdditionalSlots: "additionalSlots",
	StackSizeOverride: "stackSizeOverride",
	BonusHp: "bonusHp",
};

/**
 * Extract upgrade information from properties
 * @param {Object} properties - The upgrade properties
 * @param {string} key - The current upgrade key
 * @returns {Object} The extracted upgrade info and its validity status
 */
const extractUpgradeInfo = (properties, key) => {
	if (!properties || typeof properties !== "object") {
		return { upgradeInfo: { ...upgradeInfoTemplate }, isValid: false };
	}

	const upgradeInfo = { ...upgradeInfoTemplate };
	const propertyData = properties[key] || {};
	let isValid = false;

	// Extract properties using the mapping
	try {
		for (const [sourceKey, targetKey] of Object.entries(PROPERTY_MAPPING)) {
			if (propertyData[sourceKey] !== undefined) {
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
const extractRecipeData = (properties, key) => {
	if (!properties || typeof properties !== "object") {
		return null;
	}

	const propertyData = properties[key] || {};
	if (!propertyData.Inputs || typeof propertyData.Inputs !== "object") {
		return null;
	}

	const recipe = { ...recipeTemplate };
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
const processUpgradeEntry = (jsonData, key, profile, superUp) => {
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
		const upgrade = { ...upgradeTemplate };
		upgrade.profile = profile;
		upgrade.super = superUp;
		upgrade.name = dataParser.parseName(translator, key);

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
const parseUpgrades = (filePath) => {
	if (!filePath || typeof filePath !== "string") {
		console.error("Invalid file path provided to parseUpgrades");
		return false;
	}

	try {
		// Read and parse the file
		const rawdata = fs.readFileSync(filePath, "utf8");
		const jsonData = JSON.parse(rawdata);

		if (!jsonData[0]?.Name) {
			console.warn(`No Name property found in ${filePath}`);
			return false;
		}

		// Extract profile and super upgrade information
		const profile = dataParser.parseName(translator, jsonData[0].Name);
		const superUp = jsonData[0].Super
			? dataParser.parseName(translator, jsonData[0].Super)
			: undefined;

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

const getUpgradeItem = (upgradePure) => {
	if (upgradePure?.super) {
		const superUpgrade = utilityFunctions
			.getUpgradesData()
			.find(
				(up) =>
					up.profile === upgradePure.super && up.name === upgradePure.name,
			);
		const superUpgradeData = getUpgradeItem(superUpgrade);
		if (superUpgradeData) {
			const item = { ...itemTemplate };
			item.category = "Upgrades";
			item.name = dataParser.parseUpgradeName(
				upgradePure?.name,
				upgradePure?.profile,
			);
			item.upgradeInfo = {
				...superUpgradeData.upgradeInfo,
				...upgradePure.upgradeInfo,
			};
			if (upgradePure.crafting && superUpgradeData.crafting) {
				const recipe = { ...recipeTemplate };
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
							(ingredient) =>
								!upgradePure.crafting[0].ingredients.some(
									(i) => i.name === ingredient.name,
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
				item.crafting = upgradePure.crafting;
			} else if (superUpgradeData.crafting) {
				item.crafting = superUpgradeData.crafting;
			}
			return item;
		}
	} else {
		const item = { ...itemTemplate };
		item.category = "Upgrades";
		item.name = dataParser.parseUpgradeName(
			upgradePure?.name,
			upgradePure?.profile,
		);
		item.upgradeInfo = upgradePure?.upgradeInfo;
		item.crafting = upgradePure?.crafting;
		return item;
	}
};

const parseUpgradesToItems = () => {
	for (const upgradePure of utilityFunctions.getUpgradesData()) {
		const item = getUpgradeItem(upgradePure);
		if (item?.name) {
			utilityFunctions.getAllItems().push(item);
		}
	}
};

module.exports = {
	parseUpgrades,
	parseUpgradesToItems,
	getUpgradeItem,
	// Export for testing purposes
	_internal: {
		extractUpgradeInfo,
		extractRecipeData,
		processUpgradeEntry,
	},
};
