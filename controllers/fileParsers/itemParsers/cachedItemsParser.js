const fs = require("node:fs");
const recipeTemplate = require("../../../templates/recipe");
const costTemplate = require("../../../templates/cost");
const dataParser = require("../../dataParsers");
const translator = require("../../translator");
const utilityFunctions = require("../utilityFunctions");

const parseCachedItems = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (jsonData[0]?.Properties?.CachedTotalCost) {
		const cachedItems = jsonData[0].Properties.CachedTotalCost;
		Object.keys(cachedItems).forEach((key) => {
			if (cachedItems[key].Inputs) {
				const recipe = { ...recipeTemplate };
				const item = utilityFunctions.getItem(
					dataParser.parseName(translator, key),
				);
				const ingredients = [];
				for (const ingredientKey in cachedItems[key].Inputs) {
					const ingredient = { ...costTemplate };
					ingredient.name = dataParser.parseName(translator, ingredientKey);
					ingredient.count = cachedItems[key].Inputs[ingredientKey];
					ingredients.push(ingredient);
				}
				if (ingredients.length > 0) {
					recipe.ingredients = ingredients;
				}
				item.crafting = [recipe];

				utilityFunctions.getAllItems().push(item);
			}
		});
	}
};

module.exports = {
	parseCachedItems,
};
