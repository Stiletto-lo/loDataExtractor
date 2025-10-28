import fs from "node:fs";
import type { Recipe } from "../../../templates/recipe";
import { costTemplate } from "../../../templates/cost";
import * as dataParser from "../../dataParsers";
import * as translator from "../../translator";
import * as utilityFunctions from "../utilityFunctions";
import { Item } from "../../../templates/item";

export const parseCachedItems = (filePath: string) => {
	const rawdata = fs.readFileSync(filePath);
	//@ts-expect-error fix later
	const jsonData = JSON.parse(rawdata);
	if (jsonData[0]?.Properties?.CachedTotalCost) {
		const cachedItems = jsonData[0].Properties.CachedTotalCost;
		for (const key of Object.keys(cachedItems)) {
			if (cachedItems[key].Inputs) {
				const recipe: Recipe = {};
				let item = utilityFunctions.getItem(
					dataParser.parseName(translator, key),
				);
				if (!item) {
					item = {} as Item;
				}
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

				utilityFunctions.addItem(item);
			}
		}
	}
};
