/**
 * General item parser functions for handling item-related data
 */

const fs = require("node:fs");
const dataParser = require("../../dataParsers");
const translator = require("../../translator");
const utilityFunctions = require("../utilityFunctions");

// Import templates
const weaponInfoTemplate = require("../../../templates/weaponInfo");
const toolInfoTemplate = require("../../../templates/toolInfo");
const projectileDamageTemplate = require("../../../templates/projectileDamage");
const recipeTemplate = require("../../../templates/recipe");
const armorInfoTemplate = require("../../../templates/armorInfo");
const moduleInfoTemplate = require("../../../templates/moduleInfo");

/**
 * Get item from item data
 * @param {Object} itemData - The item data
 * @param {Object} oldItem - The old item object (optional)
 * @returns {Object|undefined} - The item object or undefined
 */
const getItemFromItemData = (itemData, oldItem) => {
	const EXTRACT_ALL_DATA = process.env.EXTRACT_ALL_DATA === "true";

	if (!itemData) {
		return oldItem ?? undefined;
	}

	const item = oldItem ?? utilityFunctions.extractItemByType(itemData.Type);

	if (itemData.Properties) {
		if (itemData.Properties?.Category?.ObjectPath) {
			const category = dataParser.parseCategory(
				itemData.Properties.Category.ObjectPath,
			);
			if (category.includes("Schematics")) {
				item.schematicName = itemData.Type;
			} else {
				item.category = dataParser.parseCategory(
					itemData.Properties.Category.ObjectPath,
				);
			}
		}
		if (
			itemData.Properties?.ExpectedPrice &&
			itemData.Properties.ExpectedPrice > 0
		) {
			item.trade_price = itemData.Properties.ExpectedPrice;
		}

		if (itemData.Properties?.MaximumQuantity) {
			if (!item.moduleInfo) {
				const moduleInfoBase = { ...moduleInfoTemplate };
				item.moduleInfo = moduleInfoBase;
			}

			item.moduleInfo.max = itemData.Properties.MaximumQuantity;
			item.moduleInfo.increase = itemData.Properties.AbsoluteIncreasePerItem
				? itemData.Properties.AbsoluteIncreasePerItem
				: undefined;
		}

		if (itemData.Properties?.PercentageIncreasePerItem) {
			if (!item.moduleInfo) {
				const moduleInfoBase = { ...moduleInfoTemplate };
				item.moduleInfo = moduleInfoBase;
			}

			item.moduleInfo.increase = itemData.Properties.PercentageIncreasePerItem;
			item.moduleInfo.maxIncrease = itemData.Properties.MaximumPercentage
				? itemData.Properties.MaximumPercentage
				: undefined;
		}

		if (itemData.Properties?.ProjectileDamage) {
			const projectileDamage = { ...projectileDamageTemplate };

			projectileDamage.damage = itemData.Properties?.ProjectileDamage?.Damage
				? itemData.Properties?.ProjectileDamage?.Damage
				: undefined;
			projectileDamage.penetration =
				EXTRACT_ALL_DATA && itemData.Properties?.ProjectileDamage?.Penetration
					? itemData.Properties?.ProjectileDamage?.Penetration
					: undefined;
			projectileDamage.effectivenessVsSoak =
				EXTRACT_ALL_DATA &&
					itemData.Properties?.ProjectileDamage?.EffectivenessVsSoak
					? itemData.Properties?.ProjectileDamage?.EffectivenessVsSoak
					: undefined;
			projectileDamage.effectivenessVsReduce =
				EXTRACT_ALL_DATA &&
					itemData.Properties?.ProjectileDamage?.EffectivenessVsReduce
					? itemData.Properties?.ProjectileDamage?.EffectivenessVsReduce
					: undefined;

			item.projectileDamage = projectileDamage;
		}

		if (itemData.Properties?.DefenseProperties) {
			const armorInfo = { ...armorInfoTemplate };

			armorInfo.absorbing = itemData.Properties?.DefenseProperties?.Soak
				? itemData.Properties?.DefenseProperties?.Soak
				: undefined;
			armorInfo.reduction = itemData.Properties?.DefenseProperties?.Reduce
				? itemData.Properties?.DefenseProperties?.Reduce
				: undefined;

			if (itemData.Properties?.MovementSpeedReduction) {
				armorInfo.speedReduction = itemData.Properties.MovementSpeedReduction;
			}

			item.armorInfo = armorInfo;
		}

		if (EXTRACT_ALL_DATA && itemData.Properties?.ExperienceRewardCrafting) {
			item.experiencieReward = itemData.Properties.ExperienceRewardCrafting;
		}

		if (itemData.Properties?.MaxStackSize) {
			item.stackSize = itemData.Properties.MaxStackSize;
		}

		if (itemData.Properties?.Weight) {
			item.weight = itemData.Properties.Weight;
		}

		if (EXTRACT_ALL_DATA && itemData.Properties?.MaxDurability) {
			item.durability = itemData.Properties.MaxDurability;
		}

		const weaponInfo = { ...weaponInfoTemplate };

		if (EXTRACT_ALL_DATA && itemData.Properties?.DurabilityDamage) {
			weaponInfo.durabilityDamage = itemData.Properties.DurabilityDamage;
			item.weaponInfo = weaponInfo;
		}
		if (itemData.Properties?.WeaponSpeed) {
			weaponInfo.weaponSpeed = itemData.Properties.WeaponSpeed;
			item.weaponInfo = weaponInfo;
		}
		if (EXTRACT_ALL_DATA && itemData.Properties?.Impact) {
			weaponInfo.impact = itemData.Properties.Impact;
			item.weaponInfo = weaponInfo;
		}
		if (EXTRACT_ALL_DATA && itemData.Properties?.Stability) {
			weaponInfo.stability = itemData.Properties.Stability;
			item.weaponInfo = weaponInfo;
		}
		if (itemData.Properties?.WeaponLength) {
			weaponInfo.weaponLength = itemData.Properties.WeaponLength;
			item.weaponInfo = weaponInfo;
		}

		if (itemData.Properties?.DamageProperties) {
			if (itemData.Properties?.DamageProperties?.Damage) {
				weaponInfo.damage = itemData.Properties.DamageProperties.Damage;
				item.weaponInfo = weaponInfo;
			}
			if (itemData.Properties?.DamageProperties?.Penetration) {
				weaponInfo.penetration =
					itemData.Properties.DamageProperties.Penetration;
				item.weaponInfo = weaponInfo;
			}
		}

		if (itemData.Properties?.ToolInfo) {
			const toolInfosData = itemData.Properties.ToolInfo;
			const toolInfos = item.toolInfo ? item.toolInfo : [];

			for (const toolInfoData of toolInfosData) {
				const baseToolInfo = { ...toolInfoTemplate };
				baseToolInfo.tier = toolInfoData.Tier;
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

		if (itemData.Properties?.Recipes) {
			const recipesData = itemData.Properties.Recipes;
			const crafting = [];
			for (const recipeData of recipesData) {
				const recipe = { ...recipeTemplate };
				if (recipeData.Inputs) {
					const ingredients = [];
					for (const key in recipeData.Inputs) {
						ingredients.push(
							utilityFunctions.getIngredientsFromItem(recipeData.Inputs, key),
						);
					}
					if (ingredients.length > 0) {
						recipe.ingredients = ingredients;
					}
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
					recipe.station = dataParser
						.parseName(translator, recipeData.Category.ObjectName)
						.trim();
				}
				crafting.push(recipe);
			}
			if (crafting.length > 0) {
				item.crafting = crafting;
			}
		}
		if (itemData?.Properties?.Name?.Key) {
			if (
				itemData.Properties.Name.SourceString &&
				itemData.Properties.Name.SourceString.trim().length > 0
			) {
				item.name = itemData.Properties.Name.SourceString.trim();
				item.translation = itemData.Properties.Name.SourceString.trim();
			} else {
				item.translation = itemData.Properties.Name.Key.replace(
					".Name",
					"",
				).trim();
				if (!item.name) {
					item.name = dataParser.parseName(translator, item.translation);
				}
			}
		}

		if (itemData?.Properties?.DamageType?.ObjectName) {
			item.damageType = dataParser.parseType(
				itemData.Properties.DamageType.ObjectName,
			);
		}

		item.wikiVisibility = itemData?.Properties?.bWikiVisibility;
	}

	if (
		!item.category &&
		(item.name === "Worm Scale" ||
			item.name === "Proxy License" ||
			item.name === "Flots" ||
			item.name === "Fiery Concoction")
	) {
		item.category = "Resources";
	}

	return item;
};

/**
 * Parse item data from a file
 * @param {string} filePath - The file path to parse
 */
const parseItemData = (filePath) => {
	if (filePath.includes("Schematics")) {
		return;
	}

	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);

	if (jsonData[1]?.Type) {
		let item = getItemFromItemData(jsonData[1]);

		if (!item?.name) {
			item = getItemFromItemData(jsonData?.[2], item);
		}

		utilityFunctions.getAllItems().push(item);
	}
};

module.exports = {
	getItemFromItemData,
	parseItemData,
};
