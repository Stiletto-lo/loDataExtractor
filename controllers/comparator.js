/**
 * Comparator module for comparing extracted game items with existing items
 * @module controllers/comparator
 */

require("dotenv").config();

const axios = require("axios");
const fs = require("node:fs/promises");
const console = require("node:console");

/**
 * Configuration for which item properties to compare
 * @type {Object}
 */
const DATA_TO_COMPARE = {
	cost: process.env.COMPARE_COST === "true",
	crafting: process.env.COMPARE_CRAFTING === "true",
	crafting_time: process.env.COMPARE_CRAFTING_TIME === "true",
	category: process.env.COMPARE_CATEGORY === "true",
	parent: process.env.COMPARE_PARENT === "true",
	damage: process.env.COMPARE_DAMAGE === "true",
	trade_price: process.env.COMPARE_PRICE === "true",
};

/**
 * Controller object containing comparison methods
 * @type {Object}
 */
const controller = {};

/**
 * Writes data to a JSON file
 * @param {string} filePath - Path to write the file
 * @param {Object} data - Data to write to the file
 * @returns {Promise<void>}
 */
async function writeJsonFile(filePath, data) {
	try {
		await fs.writeFile(filePath, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error(`Error creating file ${filePath}:`, error.message);
	}
}

/**
 * Compares extracted items with items from GitHub repository
 * @param {Array} extractedItems - Items extracted from game files
 * @param {string} folderPath - Path to save comparison results
 * @returns {Promise<void>}
 */
controller.compareItems = async (extractedItems, folderPath) => {
	console.log("Start of item comparison");
	const githubItems = await controller.getAllItems();
	const itemsNotFound = [];
	const differentItems = [];
	let sameItems = 0;

	console.log(`Extracted items: ${extractedItems?.length || 0}`);
	console.log(`Github items: ${githubItems?.length || 0}`);

	if (!extractedItems || !githubItems) {
		console.error("Missing items data for comparison");
		return;
	}

	let remainingGithubItems = [...githubItems];

	for (const extractedItem of extractedItems) {
		const itemFound = remainingGithubItems.find(
			(githubItem) => githubItem.name === extractedItem.name
		);

		// Remove the found item from the remaining items
		remainingGithubItems = remainingGithubItems.filter(
			(githubItem) => githubItem.name !== extractedItem.name
		);

		if (itemFound) {
			if (controller.isItemSame(extractedItem, itemFound)) {
				sameItems++;
			} else {
				differentItems.push(extractedItem);
			}
		} else {
			itemsNotFound.push(extractedItem);
		}
	}

	console.log(`Matching items: ${sameItems}`);
	console.log(`Different items: ${differentItems.length}`);
	console.log(`Items that are not added: ${itemsNotFound.length}`);
	console.log(`Items not extracted: ${remainingGithubItems.length}`);

	// Write comparison results to files
	if (differentItems.length > 0) {
		await writeJsonFile(`${folderPath}differentItems.json`, differentItems);
	}

	if (itemsNotFound.length > 0) {
		await writeJsonFile(`${folderPath}itemsNotFound.json`, itemsNotFound);
	}

	if (remainingGithubItems.length > 0) {
		await writeJsonFile(`${folderPath}githubItems.json`, remainingGithubItems);
	}
};

/**
 * Checks if two items are the same based on configured comparison properties
 * @param {Object} extractedItem - Item extracted from game files
 * @param {Object} githubItem - Item from GitHub repository
 * @returns {boolean} - True if items are the same, false otherwise
 */
controller.isItemSame = (extractedItem, githubItem) => {
	// Check each property based on configuration
	if (DATA_TO_COMPARE.cost && !controller.compareCost(extractedItem, githubItem)) {
		return false;
	}

	if (DATA_TO_COMPARE.crafting && !controller.compareCrafting(extractedItem, githubItem)) {
		return false;
	}

	if (DATA_TO_COMPARE.damage && !Object.is(githubItem.damage, extractedItem.damage)) {
		return false;
	}

	if (DATA_TO_COMPARE.category && !Object.is(githubItem.category, extractedItem.category)) {
		return false;
	}

	if (DATA_TO_COMPARE.parent && !Object.is(githubItem.parent, extractedItem.parent)) {
		return false;
	}

	if (DATA_TO_COMPARE.trade_price && !Object.is(githubItem.trade_price, extractedItem.trade_price)) {
		return false;
	}

	return true;
};

/**
 * Compares crafting properties between two items
 * @param {Object} extractedItem - Item extracted from game files
 * @param {Object} githubItem - Item from GitHub repository
 * @returns {boolean} - True if crafting properties are the same, false otherwise
 */
controller.compareCrafting = (extractedItem, githubItem) => {
	// If neither item has crafting data, they're considered the same
	if (!githubItem.crafting && !extractedItem.crafting) {
		return true;
	}

	// If only one item has crafting data, they're different
	if (!githubItem.crafting || !extractedItem.crafting) {
		return false;
	}

	// If they have different numbers of crafting recipes, they're different
	if (githubItem.crafting.length !== extractedItem.crafting.length) {
		return false;
	}

	// Check if either item has ingredients
	const hasIngredients = githubItem?.crafting?.[0]?.ingredients ||
		extractedItem?.crafting?.[0]?.ingredients;

	if (hasIngredients) {
		// Check if ingredients are defined and have the same length
		const githubIngredients = githubItem.crafting[0].ingredients;
		const extractedIngredients = extractedItem.crafting[0].ingredients;

		if (!githubIngredients || !extractedIngredients ||
			githubIngredients.length !== extractedIngredients.length) {
			return false;
		}

		// Compare total ingredient counts
		const githubItemTotalIngredients = calculateTotalIngredients(githubItem.crafting);
		const extractedItemTotalIngredients = calculateTotalIngredients(extractedItem.crafting);

		if (githubItemTotalIngredients !== extractedItemTotalIngredients) {
			return false;
		}

		// Compare crafting times if configured
		if (DATA_TO_COMPARE.crafting_time) {
			const githubItemTotalTime = calculateTotalCraftingTime(githubItem.crafting);
			const extractedItemTotalTime = calculateTotalCraftingTime(extractedItem.crafting);

			if (githubItemTotalTime !== extractedItemTotalTime) {
				return false;
			}
		}
	}

	return true;
};

/**
 * Calculates the total number of ingredients across all recipes
 * @param {Array} craftingRecipes - Array of crafting recipes
 * @returns {number} - Total ingredient count
 */
function calculateTotalIngredients(craftingRecipes) {
	let total = 0;
	for (const recipe of craftingRecipes) {
		if (recipe.ingredients) {
			for (const ingredient of recipe.ingredients) {
				if (ingredient.count) {
					total += ingredient.count;
				}
			}
		}
	}
	return total;
}

/**
 * Calculates the total crafting time across all recipes
 * @param {Array} craftingRecipes - Array of crafting recipes
 * @returns {number} - Total crafting time
 */
function calculateTotalCraftingTime(craftingRecipes) {
	let total = 0;
	for (const recipe of craftingRecipes) {
		if (recipe.time) {
			total += recipe.time;
		}
	}
	return total;
}

/**
 * Compares cost properties between two items
 * @param {Object} extractedItem - Item extracted from game files
 * @param {Object} githubItem - Item from GitHub repository
 * @returns {boolean} - True if cost properties are the same, false otherwise
 */
controller.compareCost = (extractedItem, githubItem) => {
	// If neither item has cost data, they're considered the same
	if (!githubItem.cost && !extractedItem.cost) {
		return true;
	}

	// If only one item has cost data, they're different
	if (!githubItem.cost || !extractedItem.cost) {
		return false;
	}

	// Compare cost count
	if (!githubItem.cost.count || !extractedItem.cost.count ||
		githubItem.cost.count !== extractedItem.cost.count) {
		return false;
	}

	// Compare cost name
	if (!githubItem.cost.name || !extractedItem.cost.name ||
		githubItem.cost.name !== extractedItem.cost.name) {
		return false;
	}

	return true;
};

/**
 * Fetches all items from GitHub repository
 * @returns {Promise<Array>} - Array of items from GitHub
 */
controller.getAllItems = async () => {
	try {
		const response = await axios.get(
			"https://raw.githubusercontent.com/dm94/stiletto-web/master/public/json/items_min.json"
		);
		return response.data;
	} catch (error) {
		console.error("Error fetching items from GitHub:", error.message);
		return [];
	}
};

module.exports = controller;
