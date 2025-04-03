/**
 * Placeable parser functions for handling placeable-related data
 */

const fs = require("node:fs");
const dataParser = require("../../dataParsers");
const translator = require("../../translator");
const utilityFunctions = require("../utilityFunctions");

// Import templates
const recipeTemplate = require("../../../templates/recipe");
const structureInfoTemplate = require("../../../templates/structureInfo");

/**
 * Parse placeable data from a file
 * @param {string} filePath - The file path to parse
 */
const parsePlaceableData = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);

	if (jsonData?.[1]?.Type) {
		const item = utilityFunctions.extractItemByType(jsonData[1].Type);
		if (jsonData[1].Type.includes("Rig")) {
			let rigName = null;
			let wakerName = null;
			if (jsonData[1].Properties?.Name?.SourceString) {
				rigName = dataParser.parseName(
					translator,
					jsonData[1].Properties.Name.SourceString.trim(),
				);
			} else if (jsonData[1].Properties?.Name?.Key) {
				rigName = dataParser.parseName(
					translator,
					jsonData[1].Properties.Name.Key.trim(),
				);
			}
			if (jsonData[1].Properties?.Description?.Key) {
				wakerName = dataParser.parseName(
					translator,
					jsonData[1].Properties.Description.Key.trim(),
				);
			}
			if (rigName != null && wakerName != null) {
				item.name = `${wakerName} ${rigName}`;
			} else {
				item.name = dataParser.parseRigName(translator, jsonData[1].Type);
			}
		} else {
			item.name = dataParser.parseName(translator, jsonData[1].Type);
		}

		if (jsonData[1].Properties) {
			if (jsonData[1].Properties?.Category?.ObjectPath) {
				item.category = dataParser.parseCategory(
					jsonData[1].Properties.Category.ObjectPath,
				);
			} else if (jsonData[1].Type.includes("Rig")) {
				item.category = "Rigs";
			}

			if (jsonData[1].Properties?.FullCost) {
				const recipeData = jsonData[1].Properties.FullCost;
				if (recipeData.Inputs) {
					const recipe = { ...recipeTemplate };
					const ingredients = [];
					for (const key in recipeData.Inputs) {
						ingredients.push(
							utilityFunctions.getIngredientsFromItem(recipeData.Inputs, key),
						);
					}

					if (ingredients.length > 0) {
						recipe.ingredients = ingredients;
					}
					item.crafting = [recipe];
				}
			}

			if (
				process.env.EXTRACT_ALL_DATA === "true" &&
				jsonData[1].Properties?.Requirements?.ExperienceRewardCrafting
			) {
				item.experiencieReward =
					jsonData[1].Properties.Requirements.ExperienceRewardCrafting;
			}

			if (jsonData[1].Properties?.CachedCraftingPartsInfo) {
				const structureInfo = { ...structureInfoTemplate };

				if (jsonData[1].Properties?.CachedCraftingPartsInfo?.MaxHP) {
					structureInfo.hp =
						jsonData[1].Properties.CachedCraftingPartsInfo.MaxHP;
					item.structureInfo = structureInfo;
				}
				if (
					jsonData[1].Properties?.CachedCraftingPartsInfo?.Protection
						?.ObjectName
				) {
					structureInfo.type =
						jsonData[1].Properties.CachedCraftingPartsInfo.Protection?.ObjectName.replace(
							"Class'MistArmor",
							"",
						).replace("'", "");
					item.structureInfo = structureInfo;
				}
			}

			if (jsonData[1].Properties?.WalkerCategory) {
				item.walkerinfo = {
					category: dataParser.parseCategory(
						jsonData[1].Properties.WalkerCategory,
					),
				};
			}

			if (!jsonData[1].Type.includes("Rig")) {
				// First check for TechtreeName.SourceString
				if (jsonData[1].Properties?.TechtreeName?.SourceString) {
					item.name = jsonData[1].Properties.TechtreeName.SourceString.trim();
				}
				// Fall back to Name.SourceString if TechtreeName is not available
				else if (jsonData[1].Properties?.Name?.SourceString) {
					item.name = jsonData[1].Properties.Name.SourceString.trim();
				} else if (jsonData[1].Properties?.Name?.Key) {
					item.translation = jsonData[1].Properties.Name.Key.replace(
						".Name",
						"",
					).trim();
				}
			}

			if (!item.category && item?.translation?.includes?.("WallsWoodLight")) {
				item.category = "StructuralWoodLight";
			}

			if (item?.category?.includes?.("Structural")) {
				item.name = dataParser.parseStructureName(
					item.category,
					translator.translateItem(item).name,
				);
				item.translation = undefined;
			}
		}

		utilityFunctions.getAllItems().push(item);
	}
};

module.exports = {
	parsePlaceableData,
};
