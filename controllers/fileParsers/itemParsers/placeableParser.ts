/**
 * Placeable parser functions for handling placeable-related data
 */

import * as dataParser from "../../dataParsers";
import * as translator from "../../translator";
import * as utilityFunctions from "../utilityFunctions";

// Import templates
import { recipeTemplate } from "../../../templates/recipe";
import type { StructureInfo } from "../../../templates/structureInfo";
import { readJsonFile } from "../../utils/read-json-file";

/**
 * Parse placeable data from a file
 * @param {string} filePath - The file path to parse
 */
export const parsePlaceableData = (filePath: string) => {
	const jsonData = readJsonFile(filePath);

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
			} else if (jsonData[1].Properties?.Requirements) {
				const recipeData = jsonData[1].Properties.Requirements;
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

			if (jsonData[1].Properties?.Requirements?.ExperienceRewardCrafting) {
				item.experiencieReward =
					jsonData[1].Properties.Requirements.ExperienceRewardCrafting;
			}

			if (jsonData[1].Properties?.CachedCraftingPartsInfo) {
				const structureInfo: StructureInfo = {};

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
				item.walkerInfo = {
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

			if (
				jsonData[1].Properties?.Requirements?.RequiredUnlockable?.ObjectPath
			) {
				let objectPath =
					jsonData[1].Properties.Requirements.RequiredUnlockable.ObjectPath;
				if (typeof objectPath !== "string") {
					objectPath = String(objectPath);
				}
				if (typeof objectPath === "string" && objectPath.length > 0) {
					const unlockableType = dataParser.parseObjectPath(objectPath);
					//@ts-expect-error fix later
					item.unlockable = translator.translateName(unlockableType);
				}
			}
		}

		if (item.category?.includes("Structural")) {
			item.name = dataParser.parseStructureName(item.category, item.name);
		}

		utilityFunctions.addItem(item);
	}
};
