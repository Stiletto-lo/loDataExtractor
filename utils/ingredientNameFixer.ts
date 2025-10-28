/**
 * Ingredient Name Fixer Module
 *
 * This module provides functionality to fix ingredient names in recipes
 * by applying the item name glossary to ensure consistency.
 */

const fileParser = require("../controllers/fileParsers");

/**
 * Applies the item name glossary to ingredient names in recipes
 * @param {Array} items - Array of items with crafting recipes
 * @returns {Array} - The items with fixed ingredient names
 */
const fixIngredientNames = (items: Array<any>) => {
	if (!Array.isArray(items)) {
		console.error("Items must be an array");
		return items;
	}

	// Get the item name glossary
	const glossary = fileParser.getGlossary();

	// If glossary is empty, return items unchanged
	if (!glossary || Object.keys(glossary).length === 0) {
		console.warn(
			"Item name glossary is empty, ingredient names will not be fixed",
		);
		return items;
	}

	console.log(
		`Applying name glossary to ingredient names (${Object.keys(glossary).length} entries available)`,
	);
	let fixedCount = 0;

	// Process each item
	for (const item of items) {
		// Skip items without crafting recipes
		if (!item.crafting || !Array.isArray(item.crafting)) {
			continue;
		}

		// Process each crafting recipe
		for (const recipe of item.crafting) {
			// Skip recipes without ingredients
			if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
				continue;
			}

			// Process each ingredient
			for (const ingredient of recipe.ingredients) {
				// Skip ingredients without a name
				if (!ingredient.name) {
					continue;
				}

				// Check if the ingredient name exists in the glossary
				if (glossary[ingredient.name]) {
					// Apply the glossary name
					const originalName = ingredient.name;
					ingredient.name = glossary[originalName];
					fixedCount++;
				}
			}
		}
	}

	console.log(`Fixed ${fixedCount} ingredient names using the glossary`);
	return items;
};

module.exports = {
	fixIngredientNames,
};
