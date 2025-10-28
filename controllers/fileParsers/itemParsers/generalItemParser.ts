/**
 * General item parser functions for handling item-related data
 */

import * as dataParser from "../../dataParsers";
import * as translator from "../../translator";
import * as utilityFunctions from "../utilityFunctions";
import { readJsonFile } from "../../utils/read-json-file";

// Import templates
import type { WeaponInfo } from "../../../templates/weaponInfo";
import type { ToolInfo } from "../../../templates/toolInfo";
import { projectileDamageTemplate } from "../../../templates/projectileDamage";
import type { Recipe } from "../../../templates/recipe";
import { armorInfoTemplate } from "../../../templates/armorInfo";
import { moduleInfoTemplate } from "../../../templates/moduleInfo";
import { costTemplate } from "../../../templates/cost";

/**
 * Get item from item data
 * @param {Object} itemData - The item data
 * @param {Object} oldItem - The old item object (optional)
 * @returns {Object|undefined} - The item object or undefined
 */
export const getItemFromItemData = (itemData: any, oldItem: any) => {
	if (!itemData) {
		return oldItem ?? undefined;
	}

	const item = oldItem ?? utilityFunctions.extractItemByType(itemData.Type);

	// Helper to get string from SourceString or LocalizedString
	const getString = (obj: any, key: string) =>
		obj?.[key]?.SourceString?.trim() ||
		obj?.[key]?.LocalizedString?.trim() ||
		"";

	// Helper to add translation
	const setTranslation = (key: string, name: string) => {
		if (key && name) {
			translator.addTranslation(key.replace(".Name", "").trim(), name);
			translator.addTranslationInUse(itemData.Type, name);
		}
	};

	// Helper to add description
	const setDescription = (name: string, description: string) => {
		if (name && description) {
			translator.addDescription(name, description);
			translator.addDescription(itemData.Type, description);
		}
	};

	// Walker part category
	if (
		item.name &&
		(item.name.includes("Walker Legs") || item.name.includes("Walker Wings")) &&
		item.name.includes("(1 of 2)")
	) {
		item.category = "WalkerParts";
	}

	const props = itemData.Properties;
	if (props) {
		// Category/Schematic
		if (props?.Category?.ObjectPath) {
			const category = dataParser.parseCategory(props.Category.ObjectPath);
			if (category?.includes("Schematics")) {
				item.schematicName = itemData.Type;
			} else {
				item.category = category;
			}
		}

		// Name/Translation
		const name = getString(props, "Name");
		if (name.length > 0) {
			setTranslation(props?.Name?.Key, name);
			item.name = name;
			item.translation = name;
		}

		// Description
		const description = getString(props, "Description");
		if (description.length > 0) {
			setDescription(item.name, description);
			item.description = description;
		}

		// Acquisition Hint
		const acquisitionHint = getString(props, "AcquisitionHint");
		if (acquisitionHint.length > 0) {
			item.whereToFarm = acquisitionHint;
		}

		// Techtree Name
		const techtreeName = getString(props, "TechtreeName");
		if (techtreeName.length > 0) {
			setTranslation(props?.TechtreeName?.Key, techtreeName);
			item.name = techtreeName;
			item.translation = techtreeName;
		}

		// Trade price
		if (props?.ExpectedPrice > 0) {
			item.trade_price = props.ExpectedPrice;
		}

		// Module Info
		if (props?.MaximumQuantity || props?.PercentageIncreasePerItem) {
			if (!item.moduleInfo) item.moduleInfo = { ...moduleInfoTemplate };
			if (props?.MaximumQuantity) {
				item.moduleInfo.max = props.MaximumQuantity;
				item.moduleInfo.increase = props.AbsoluteIncreasePerItem ?? undefined;
			}
			if (props?.PercentageIncreasePerItem) {
				item.moduleInfo.increase = props.PercentageIncreasePerItem;
				item.moduleInfo.maxIncrease = props.MaximumPercentage ?? undefined;
			}
		}

		// Projectile Damage
		if (props?.ProjectileDamage) {
			item.projectileDamage = {
				...projectileDamageTemplate,
				damage: props.ProjectileDamage.Damage ?? undefined,
				penetration: props.ProjectileDamage.Penetration ?? undefined,
				effectivenessVsSoak:
					props.ProjectileDamage.EffectivenessVsSoak ?? undefined,
				effectivenessVsReduce:
					props.ProjectileDamage.EffectivenessVsReduce ?? undefined,
			};
		}

		// Armor Info
		if (props?.DefenseProperties) {
			item.armorInfo = {
				...armorInfoTemplate,
				absorbing: props.DefenseProperties.Soak ?? undefined,
				reduction: props.DefenseProperties.Reduce ?? undefined,
				speedReduction: props.MovementSpeedReduction ?? undefined,
			};
		}

		// Experience reward
		if (props?.ExperienceRewardCrafting) {
			item.experiencieReward = props.ExperienceRewardCrafting;
		}

		// Stack size, weight, durability
		if (props?.MaxStackSize) item.stackSize = props.MaxStackSize;
		if (props?.Weight) item.weight = props.Weight;
		if (props?.MaxDurability) item.durability = props.MaxDurability;

		// Weapon Info
		const weaponInfo = {} as WeaponInfo;
		let hasWeaponInfo = false;
		if (props?.DurabilityDamage) {
			weaponInfo.durabilityDamage = props.DurabilityDamage;
			hasWeaponInfo = true;
		}
		if (props?.WeaponSpeed) {
			weaponInfo.weaponSpeed = props.WeaponSpeed;
			hasWeaponInfo = true;
		}
		if (props?.Impact) {
			weaponInfo.impact = props.Impact;
			hasWeaponInfo = true;
		}
		if (props?.Stability) {
			weaponInfo.stability = props.Stability;
			hasWeaponInfo = true;
		}
		if (props?.WeaponLength) {
			weaponInfo.weaponLength = props.WeaponLength;
			hasWeaponInfo = true;
		}
		if (props?.DamageProperties) {
			if (props.DamageProperties.Damage) {
				weaponInfo.damage = props.DamageProperties.Damage;
				hasWeaponInfo = true;
			}
			if (props.DamageProperties.Penetration) {
				weaponInfo.penetration = props.DamageProperties.Penetration;
				hasWeaponInfo = true;
			}
		}
		if (hasWeaponInfo) {
			item.weaponInfo = weaponInfo;
		}

		// Tool Info
		if (props?.ToolInfo) {
			const toolInfos: ToolInfo[] = item.toolInfo ? item.toolInfo : [];
			for (const toolInfoData of props.ToolInfo) {
				const baseToolInfo: ToolInfo = {
					tier: toolInfoData.Tier,
				};
				if (toolInfoData.ToolType.includes("TreeCutting")) {
					baseToolInfo.toolType = "TreeCutting";
				} else if (toolInfoData.ToolType.includes("Scythe")) {
					baseToolInfo.toolType = "Scythe";
				} else if (toolInfoData.ToolType.includes("Mining")) {
					baseToolInfo.toolType = "Mining";
				} else {
					baseToolInfo.toolType = toolInfoData.ToolType.replace(
						"EEquipmentTool::",
						"",
					);
				}
				toolInfos.push(baseToolInfo);
			}
			if (toolInfos.length > 0) {
				item.toolInfo = toolInfos;
			}
		}

		// Recipes/Crafting
		if (props?.Recipes) {
			const crafting: Recipe[] = [];
			for (const recipeData of props.Recipes) {
				const recipe: Recipe = {};
				if (recipeData.Inputs) {
					const ingredients: { name: string; count: number }[] = [];
					for (const key in recipeData.Inputs) {
						const ingredient = utilityFunctions.getIngredientsFromItem(
							recipeData.Inputs,
							key,
						);
						if (ingredient?.name && ingredient?.count) {
							ingredients.push({
								name: ingredient.name,
								count: ingredient.count,
							});
						}
					}
					if (ingredients.length > 0) recipe.ingredients = ingredients;
				}
				if (recipeData.Quantity && recipeData.Quantity > 1) {
					recipe.output = recipeData.Quantity;
				}
				if (recipeData.CraftingTime && recipeData.CraftingTime > 0) {
					recipe.time = recipeData.CraftingTime;
				}
				if (
					recipeData?.Category?.ObjectName &&
					!recipeData.Category.ObjectName.includes("Base")
				) {
					const station = dataParser
						.parseName(translator, recipeData.Category.ObjectName)
						?.trim();

					if (station) {
						recipe.station = station;
					}
				}
				crafting.push(recipe);
			}
			if (crafting.length > 0) {
				item.crafting = crafting;
			}
		}

		// Fallback name/translation
		if (props?.Name?.Key) {
			if (
				props.Name.SourceString &&
				props.Name.SourceString.trim().length > 0
			) {
				item.name = props.Name.SourceString.trim();
				item.translation = props.Name.SourceString.trim();
			} else {
				item.translation = props.Name.Key.replace(".Name", "").trim();
				if (!item.name) {
					item.name = dataParser.parseName(translator, item.translation);
				}
			}
		}

		// Damage type
		if (props?.DamageType?.ObjectName) {
			item.damageType = dataParser.parseType(props.DamageType.ObjectName);
		}

		item.wikiVisibility = props?.bWikiVisibility;
	}

	// Special resource category fallback
	if (
		!item.category &&
		["Worm Scale", "Proxy License", "Flots", "Fiery Concoction"].includes(
			item.name,
		)
	) {
		item.category = "Resources";
	}

	return item;
};

/**
 * Parse item data from a file
 * @param {string} filePath - The file path to parse
 */
export const parseItemData = (filePath: string) => {
	if (filePath.includes("Schematics")) {
		return;
	}

	const jsonData = readJsonFile(filePath);

	if (jsonData?.[1]?.Type) {
		let item = getItemFromItemData(jsonData[1], undefined);

		if (!item?.name) {
			item = getItemFromItemData(jsonData?.[2], item);
		}

		utilityFunctions.addItem(item);
	}
};
