require("dotenv").config();
const controller = {};
const fs = require("fs");
const dataParser = require("./dataParsers");
const translator = require("./translator");

const itemTemplate = require("../templates/item");
const weaponInfoTemplate = require("../templates/weaponInfo");
const toolInfoTemplate = require("../templates/toolInfo");
const projectileDamageTemplate = require("../templates/projectileDamage");
const recipeTemplate = require("../templates/recipe");
const dropTemplate = require("../templates/drop");
const armorInfoTemplate = require("../templates/armorInfo");
const structureInfoTemplate = require("../templates/structureInfo");
const moduleInfoTemplate = require("../templates/moduleInfo");
const ingredienTemplate = require("../templates/cost");
const costTemplate = require("../templates/cost");
const upgradeTemplate = require("../templates/upgrade");
const upgradeInfoTemplate = require("../templates/upgradeInfo");
const dropDataTemplate = require("../templates/dropData");
const dataTableTemplate = require("../templates/datatable");
const blueprintTemplate = require("../templates/lootBlueprint");
const creatureTemplate = require("../templates/creature");

const EXTRACT_ALL_DATA = process.env.EXTRACT_ALL_DATA === "true";
const SHOW_DEV_ITEMS = process.env.SHOW_DEV_ITEMS === "true";

let allItems = [];
const upgradesData = [];
const creatures = [];

const allDatatables = [];
const allBlueprints = [];

controller.parseLocation = (blueprint, location) => {
	blueprint.tables.forEach((dataTable) => {
		let dataTableChance = 100;
		let maxIterations = 1;
		if (dataTable.maxIterations) {
			maxIterations = dataTable.minIterations;
		}
		if (dataTable.dataTableChance) {
			dataTableChance = dataTable.dataTableChance;
		}

		const maxChance = (dataTableChance * maxIterations) / 100;

		dataTable.dropItems.forEach((lootItemData) => {
			const item = controller.getItem(
				dataParser.parseName(translator, lootItemData.name),
			);
			if (item?.name) {
				const itemDrops = item.drops ? item.drops : [];
				const hasDrop = itemDrops.some((d) => d.location === location);
				if (!hasDrop && item.name != location) {
					const drop = { ...dropTemplate };
					drop.location = location;
					if (EXTRACT_ALL_DATA && lootItemData.chance) {
						drop.chance = lootItemData.chance;
					}
					if (EXTRACT_ALL_DATA && lootItemData.minQuantity) {
						drop.minQuantity = lootItemData.minQuantity;
					}
					if (EXTRACT_ALL_DATA && lootItemData.maxQuantity) {
						drop.maxQuantity = lootItemData.maxQuantity;
					}
					if (drop.chance) {
						drop.chance = (drop.chance * maxChance) / 100;
					}
					itemDrops.push(drop);
					item.drops = itemDrops;
				}
				allItems.push(item);
			}
		});
	});
};

controller.parseBlueprintsToItems = () => {
	allBlueprints.forEach((blueprint) => {
		const locations = creatures.filter((c) => c.lootTable === blueprint.name);
		if (locations.length > 0) {
			locations.forEach((location) => {
				controller.parseLocation(blueprint, location.name);
			});
		} else {
			const location = translator.translateLootSite(blueprint.name);
			controller.parseLocation(blueprint, location);
		}
	});
};

controller.parseLootTable = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (
		jsonData[0].Name &&
		jsonData[0].Rows &&
		jsonData?.[0]?.Type == "DataTable"
	) {
		const dataTable = { ...dataTableTemplate };
		dataTable.name = dataParser.parseName(translator, jsonData[0].Name);
		const lootItems = jsonData[0].Rows;
		const dataTableItems = [];
		Object.keys(lootItems).forEach((key) => {
			if (lootItems[key].Item) {
				let name = dataParser.parseName(translator, key);
				if (name) {
					const completeItem = controller.getItemByType(
						dataParser.parseType(lootItems[key].Item.AssetPathName),
					);
					if (completeItem?.name) {
						name = completeItem.name;
					} else if (
						lootItems[key]?.Item?.AssetPathName?.includes?.("Schematics")
					) {
						name = name + " Schematic";
					}
					const hasDrop = dataTable.dropItems.some((d) => d.name === name);
					if (!hasDrop && name != dataTable.name) {
						const drop = { ...dropDataTemplate };
						drop.name = name;
						if (EXTRACT_ALL_DATA && lootItems[key].Chance) {
							drop.chance = lootItems[key].Chance;
						}
						if (EXTRACT_ALL_DATA && lootItems[key].MinQuantity) {
							drop.minQuantity = lootItems[key].MinQuantity;
						}
						if (EXTRACT_ALL_DATA && lootItems[key].MaxQuantity) {
							drop.maxQuantity = lootItems[key].MaxQuantity;
						}
						dataTableItems.push(drop);
					}
				}
			}
		});
		dataTable.dropItems = dataTableItems;
		allDatatables.push(dataTable);
	}
};

controller.parseLootBlueprint = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (jsonData[0].Name && jsonData?.[0]?.Type == "BlueprintGeneratedClass") {
		if (jsonData[1]?.Type) {
			const blueprint = { ...blueprintTemplate };
			blueprint.name = dataParser.parseName(translator, jsonData[1].Type);
			if (jsonData[1]?.Properties?.Loot?.Tables) {
				const allBlueprintTables = [];
				const tables = jsonData[1].Properties.Loot.Tables;
				tables.forEach((table) => {
					if (table?.Table?.ObjectPath) {
						const name = dataParser.parseName(translator, table.Table.ObjectName);
						const dataTable = allDatatables.find((data) => data.name == name);
						if (dataTable) {
							dataTable.chance = table.RunChance ? table.RunChance : undefined;
							dataTable.minIterations = table.MinIterations
								? table.MinIterations
								: undefined;
							dataTable.maxIterations = table.MaxIterations
								? table.MaxIterations
								: undefined;
							dataTable.iterationRunChance = table.PerIterationRunChance
								? table.PerIterationRunChance
								: undefined;
							dataTable.minQuantityMultiplier = table.MinQuantityMultiplier
								? table.MinQuantityMultiplier
								: undefined;
							dataTable.maxQuantityMultiplier = table.MaxQuantityMultiplier
								? table.MaxQuantityMultiplier
								: undefined;
							dataTable.onlyOne = table.bGiveItemOnlyOnce
								? table.bGiveItemOnlyOnce
								: undefined;

							allBlueprintTables.push(dataTable);
						}
					}
				});
				blueprint.tables = allBlueprintTables;
				allBlueprints.push(blueprint);
			}
		}
	}
};

controller.parseCachedItems = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (jsonData[0]?.Properties?.CachedTotalCost) {
		const cachedItems = jsonData[0].Properties.CachedTotalCost;
		Object.keys(cachedItems).forEach((key) => {
			if (cachedItems[key].Inputs) {
				const recipe = { ...recipeTemplate };
				const item = controller.getItem(dataParser.parseName(translator, key));
				const ingredients = [];
				for (const ingredientKey in cachedItems[key].Inputs) {
					const ingredient = { ...ingredienTemplate };
					ingredient.name = dataParser.parseName(translator, ingredientKey);
					ingredient.count = cachedItems[key].Inputs[ingredientKey];
					ingredients.push(ingredient);
				}
				if (ingredients.length > 0) {
					recipe.ingredients = ingredients;
				}
				item.crafting = [recipe];
				allItems.push(item);
			}
		});
	}
};

controller.getItemFromItemData = (itemData, oldItem) => {
	if (!itemData) {
		return oldItem ?? undefined;
	}

	const item = oldItem ?? controller.extractItemByType(itemData.Type);

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
			if (item.moduleInfo == undefined) {
				const moduleInfoBase = { ...moduleInfoTemplate };
				item.moduleInfo = moduleInfoBase;
			}

			item.moduleInfo.max = itemData.Properties.MaximumQuantity;
			item.moduleInfo.increase = itemData.Properties.AbsoluteIncreasePerItem
				? itemData.Properties.AbsoluteIncreasePerItem
				: undefined;
		}

		if (itemData.Properties?.PercentageIncreasePerItem) {
			if (item.moduleInfo == undefined) {
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

			toolInfosData.forEach((toolInfoData) => {
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
			});
			if (toolInfos.length > 0) {
				item.toolInfo = toolInfos;
			}
		}

		if (itemData.Properties?.Recipes) {
			const recipesData = itemData.Properties.Recipes;
			const crafting = [];
			recipesData.forEach((recipeData) => {
				const recipe = { ...recipeTemplate };
				if (recipeData.Inputs) {
					const ingredients = [];
					for (const key in recipeData.Inputs) {
						ingredients.push(
							controller.getIngredientsFromItem(recipeData.Inputs, key),
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
			});
			if (crafting.length > 0) {
				item.crafting = crafting;
			}
		}
		if (itemData?.Properties?.Name?.Key) {
			if (
				itemData.Properties.Name.SourceString &&
				itemData.Properties.Name.SourceString.trim() != ""
			) {
				item.name = itemData.Properties.Name.SourceString.trim();
				item.translation = itemData.Properties.Name.SourceString.trim();
			} else {
				item.translation = itemData.Properties.Name.Key.replace(
					".Name",
					"",
				).trim();
				if (item.name == undefined) {
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
		(item.name == "Worm Scale" ||
			item.name == "Proxy License" ||
			item.name == "Flots" ||
			item.name == "Fiery Concoction")
	) {
		item.category = "Resources";
	}

	return item;
};

controller.parseItemData = (filePath) => {
	if (filePath.includes("Schematics")) {
		return;
	}

	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);

	if (jsonData[1]?.Type) {
		let item = controller.getItemFromItemData(jsonData[1]);

		if (!item?.name) {
			item = controller.getItemFromItemData(jsonData?.[2], item);
		}

		allItems.push(item);
	}
};

controller.parseSchematicItemData = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);

	if (jsonData?.[1]?.Type) {
		const item = controller.extractItemByType(jsonData[1].Type);
		let name;
		if (jsonData[1].Properties?.Name?.Key) {
			name = jsonData[1].Properties.Name.Key;
			name = name.replaceAll(".Name", "").trim();
			name = translator.searchName(name);
		}
		if (name == null) {
			if (jsonData[1].Type.includes("Rig")) {
				name = dataParser.parseName(translator, jsonData[1].Type);
			} else if (
				jsonData[1].Properties?.Name?.SourceString &&
				jsonData[1].Properties.Name.SourceString.length > 0
			) {
				name = jsonData[1].Properties.Name.SourceString;
				name = name.trim();
			} else {
				name = dataParser.parseType(jsonData[1].Type);

				const foundItem = controller.getItemByType(name);
				if (foundItem?.name) {
					name = foundItem.name;
				}
			}
		}
		if (name) {
			if (!name.includes("Schematic")) {
				name = name + " Schematic";
			}
			item.name = name;
		}

		if (jsonData[1].Properties) {
			item.category = "Schematics";

			const itemsSchematic = [];

			if (jsonData[1].Properties?.MaxStackSize) {
				item.stackSize = jsonData[1].Properties.MaxStackSize;
			}
			if (jsonData[1].Properties?.Items) {
				const allCraftingItems = jsonData[1].Properties.Items;
				allCraftingItems.forEach((schematicItem) => {
					if (schematicItem.AssetPathName) {
						const itemFound = controller.getItemByType(
							dataParser.parseType(schematicItem.AssetPathName),
						);
						if (itemFound) {
							itemsSchematic.push(itemFound.name);
						} else {
							const schematicItemName = dataParser.parseName(
								translator,
								schematicItem.AssetPathName,
							);
							itemsSchematic.push(schematicItemName);
						}
					}
				});
			}
			if (jsonData[1].Properties?.Placeables) {
				const allCraftingPlaceables = jsonData[1].Properties.Placeables;
				allCraftingPlaceables.forEach((schematicPlaceable) => {
					if (schematicPlaceable.AssetPathName) {
						const itemFound = controller.getItemByType(
							dataParser.parseType(schematicPlaceable.AssetPathName),
						);
						if (itemFound) {
							itemsSchematic.push(itemFound.name);
						} else {
							const schematicPlaceableName = dataParser.parseName(
								translator,
								schematicPlaceable.AssetPathName,
							);
							itemsSchematic.push(schematicPlaceableName);
						}
					}
				});
			}
			if (itemsSchematic.length > 0) {
				item.learn = itemsSchematic;
				allItems.push(item);
			}
		}
	}
};

controller.parsePlaceableData = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);

	if (jsonData?.[1]?.Type) {
		const item = controller.extractItemByType(jsonData[1].Type);
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
				item.name = wakerName + " " + rigName;
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
							controller.getIngredientsFromItem(recipeData.Inputs, key),
						);
					}

					if (ingredients.length > 0) {
						recipe.ingredients = ingredients;
					}
					item.crafting = [recipe];
				}
			}

			if (
				EXTRACT_ALL_DATA &&
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
				if (jsonData[1].Properties?.Name?.SourceString) {
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

		allItems.push(item);
	}
};

controller.parseTechData = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);

	if (jsonData?.[1]?.Type) {
		const item = controller.extractItemByType(jsonData[1].Type);

		if (jsonData?.[1]?.Properties?.Requirements?.[0]?.ObjectName) {
			item.parent = translator.translateName(
				dataParser.parseName(
					translator,
					jsonData[1].Properties.Requirements[0].ObjectName,
				),
			);
		}

		if (EXTRACT_ALL_DATA && jsonData[1]?.Properties?.Cost != 1) {
			const itemCost = { ...costTemplate };
			if (
				jsonData[1].Properties.TechTreeTier &&
				(jsonData[1].Properties.TechTreeTier.includes("Tier4") ||
					jsonData[1].Properties.TechTreeTier.includes("Tier5") ||
					jsonData[1].Properties.TechTreeTier.includes("Tier6"))
			) {
				itemCost.name = "Tablet";
			} else {
				itemCost.name = "Fragment";
			}
			itemCost.count = jsonData[1].Properties.Cost;

			item.cost = itemCost;
		}

		if (jsonData[1]?.Properties?.bHidden) {
			item.onlyDevs = true;
		}

		if (jsonData[1]?.Properties?.bHidden && !SHOW_DEV_ITEMS) {
			item.parent = undefined;
		}
		if (item.name) {
			if (item.name.includes("Upgrades")) {
				item.category = "Upgrades";
			} else if (item.name.includes("Hook")) {
				item.category = "Grappling Hooks";
			}
		}

		allItems.push(item);
	}
};

controller.parseDamage = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (jsonData[1]?.Type) {
		const damageTypeClass = jsonData[1].Type;
		const allItemsWithThatDamage = allItems.filter(
			(item) => item.damageType == damageTypeClass,
		);
		allItemsWithThatDamage.forEach((itemSearch) => {
			const item = controller.getItem(itemSearch.name);
			if (item) {
				let proyectileDamage = item.projectileDamage
					? item.projectileDamage
					: { ...projectileDamageTemplate };
				proyectileDamage.vsSoft = jsonData[1]?.Properties?.DamageAgainstSoft
					? Number.parseInt(jsonData[1].Properties.DamageAgainstSoft * 100, 10)
					: undefined;
				proyectileDamage.vsMedium = jsonData[1]?.Properties?.DamageAgainstMedium
					? Number.parseInt(jsonData[1].Properties.DamageAgainstMedium * 100, 10)
					: undefined;
				proyectileDamage.vsHard = jsonData[1]?.Properties?.DamageAgainstHard
					? Number.parseInt(jsonData[1].Properties.DamageAgainstHard * 100, 10)
					: undefined;
				proyectileDamage.vsReinforced = jsonData[1]?.Properties
					?.DamageAgainstReinforced
					? Number.parseInt(jsonData[1].Properties.DamageAgainstReinforced * 100, 10)
					: undefined;
				proyectileDamage.vsSolid = jsonData[1]?.Properties?.DamageAgainstSolid
					? Number.parseInt(jsonData[1].Properties.DamageAgainstSolid * 100, 10)
					: undefined;

				proyectileDamage = dataParser.cleanEmptyObject(proyectileDamage);
				if (proyectileDamage != null) {
					item.projectileDamage = proyectileDamage;
				}

				allItems.push(item);
			}
		});
	}
};

controller.parseTranslations = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (jsonData[0]?.StringTable?.KeysToMetaData) {
		for (const key in jsonData[0].StringTable.KeysToMetaData) {
			if (key.includes(".Name")) {
				translator.addTranslation(
					key.replace(".Name", "").trim(),
					jsonData[0].StringTable.KeysToMetaData[key],
				);
			} else if (key.includes(".Description")) {
				translator.addDescription(
					key.replace(".Description", "").trim(),
					jsonData[0].StringTable.KeysToMetaData[key],
				);
			}
		}
	}
};

controller.getLootSiteNameFromObject = (objectData) =>
	objectData?.Properties?.MobName?.LocalizedString ??
	objectData?.Properties?.CampName?.LocalizedString ??
	undefined;

controller.parseLootSites = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	if (!rawdata) {
		return;
	}

	const jsonData = JSON.parse(rawdata);
	if (!jsonData) {
		return;
	}

	const objectsFiltered = jsonData.filter(
		(o) =>
			o?.Type !== "Function" &&
			o?.Type !== "BlueprintGeneratedClass" &&
			!o?.Type.includes("Component"),
	);

	const name = objectsFiltered?.[0]?.Type;
	const translation = controller.getLootSiteNameFromObject(objectsFiltered?.[0]);

	if (!translation || !name) {
		return;
	}

	translator.addLootSiteTranslation(name, translation);

	const creature = { ...creatureTemplate, type: name, name: translation };

	const additionalInfo = jsonData.find(
		(o) => o.Type === "MistHumanoidMobVariationComponent",
	);
	if (additionalInfo) {
		creature.experiencie = additionalInfo?.Properties?.ExperienceAward;
		creature.health = additionalInfo?.Properties?.MaxHealth;
		creature.lootTable = dataParser.parseObjectPath(
			additionalInfo?.Properties?.Loot?.ObjectPath,
		);
	}

	creatures.push(creature);
};

controller.parseOtherTranslations = (filePath) => {
	if (/\/Game\/(.+)\/Game.json/.test(filePath)) {
		const match = filePath.match("/Game/(.+)/Game.json");
		if (match[1] != null) {
			const languaje = match[1];
			const rawdata = fs.readFileSync(filePath);
			const jsonData = JSON.parse(rawdata);

			for (const translationGroup in jsonData) {
				for (const key in jsonData[translationGroup]) {
					if (key.includes(".Description")) {
						translator.addDescription(
							key.replace(".Description", "").trim(),
							jsonData[translationGroup][key],
							languaje,
						);
					} else {
						translator.addTranslation(
							key.replace(".Name", "").trim(),
							jsonData[translationGroup][key],
							languaje,
						);
					}
				}
			}
		}
	}
};

controller.parsePrices = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (jsonData[1]?.Properties?.OrdersArray) {
		const allOrders = jsonData[1].Properties.OrdersArray;

		allOrders.forEach((order) => {
			if (order?.ItemClass?.ObjectName && order?.Price) {
				const item = controller.extractItemByType(
					dataParser.parseType(order.ItemClass.ObjectName),
				);

				if (order.Price > item.trade_price) {
					item.trade_price = order.Price;
				}

				if (!item.category && item.name == "ProxyLicense") {
					item.category = "Resources";
				}

				allItems.push(item);
			}
		});
	}
};

controller.parseUpgrades = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);

	if (jsonData[0]?.Name) {
		const profile = dataParser.parseName(translator, jsonData[0].Name);
		const superUp = jsonData[0].Super
			? dataParser.parseName(translator, jsonData[0].Super)
			: undefined;

		if (jsonData[1]?.Properties) {
			for (const key in jsonData[1]?.Properties) {
				if (key.includes("Upgrade")) {
					const enabled = jsonData[1]?.Properties[key]?.bIsEnabled
						? jsonData[1].Properties[key].bIsEnabled
						: true;

					if (!enabled) {
						continue;
					}

					const upgrade = { ...upgradeTemplate };
					const upgradeInfo = { ...upgradeInfoTemplate };
					let upgradeInfoValid = false;

					upgrade.profile = profile;
					upgrade.super = superUp;
					upgrade.name = dataParser.parseName(translator, key);

					upgradeInfo.containerSlots =
						jsonData[1]?.Properties[key]?.ContainerSlots ?? undefined;
					upgradeInfo.engineTorqueMultiplier =
						jsonData[1]?.Properties[key]?.EngineTorqueMultiplier ?? undefined;
					upgradeInfo.sprintingTorqueDiscount =
						jsonData[1]?.Properties[key]?.SprintingTorqueDiscount ?? undefined;
					upgradeInfo.additionalParts =
						jsonData[1]?.Properties[key]?.AdditionalParts ?? undefined;
					upgradeInfo.sdditionalSlots =
						jsonData[1]?.Properties[key]?.AdditionalSlots ?? undefined;
					upgradeInfo.containerSlots =
						jsonData[1]?.Properties[key]?.ContainerSlots ?? undefined;
					upgradeInfo.stackSizeOverride =
						jsonData[1]?.Properties[key]?.StackSizeOverride ?? undefined;
					upgradeInfo.bonusHp =
						jsonData[1]?.Properties[key]?.BonusHp ?? undefined;

					Object.keys(upgradeInfo).forEach((keyUpgradeInfo) => {
						if (upgradeInfo[keyUpgradeInfo] === undefined) {
							delete upgradeInfo[keyUpgradeInfo];
						} else {
							upgradeInfoValid = true;
						}
					});

					if (upgradeInfoValid) {
						upgrade.upgradeInfo = upgradeInfo;
					}

					if (jsonData[1]?.Properties[key]?.Inputs) {
						const recipeData = jsonData[1]?.Properties[key]?.Inputs;
						const recipe = { ...recipeTemplate };
						const ingredients = [];
						for (const keyInput in recipeData) {
							const ingredient = controller.getIngredientsFromItem(
								recipeData,
								keyInput,
							);
							ingredients.push(ingredient);
						}
						if (ingredients.length > 0) {
							recipe.ingredients = ingredients;
						}
						if (jsonData[1]?.Properties[key]?.CraftingTime) {
							recipe.time = jsonData[1].Properties[key].CraftingTime;
						}
						upgrade.crafting = [recipe];
					}
					upgradesData.push(upgrade);
				}
			}
		}
	}
};

controller.parseUpgradesToItems = () => {
	upgradesData.forEach((upgradePure) => {
		const item = controller.getUpgradeItem(upgradePure);
		if (item?.name) {
			allItems.push(item);
		}
	});
};

controller.getUpgradeItem = (upgradePure) => {
	if (upgradePure?.super) {
		const superUpgrade = upgradesData.find(
			(up) => up.profile == upgradePure.super && up.name == upgradePure.name,
		);
		const superUpgradeData = controller.getUpgradeItem(superUpgrade);
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
									(i) => i.name == ingredient.name,
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
		} else {
			return null;
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

controller.getItemByType = (itemType) => {
	if (!itemType.includes("_C")) {
		itemType = itemType + "_C";
	}
	return allItems.find((it) => {
		return it.type && it.type == itemType;
	});
};

controller.extractItemByType = (itemType) => {
	let itemCopy = { ...itemTemplate };

	if (!itemType.includes("_C")) {
		itemType = itemType + "_C";
	}

	allItems = allItems.filter((it) => {
		if (it.type && it.type == itemType) {
			itemCopy = it;
			return false;
		}
		return true;
	});

	itemCopy.type = itemType;

	return itemCopy;
};

controller.getItem = (itemName) => {
	let itemCopy = { ...itemTemplate };
	let found = false;

	allItems = allItems.filter((item) => {
		if (item.name == itemName) {
			itemCopy = item;
			found = true;
			return false;
		}
		return true;
	});

	if (!found) {
		allItems = allItems.filter((item) => {
			if (item.translation && item.translation == itemName) {
				itemCopy = item;
				return false;
			}
			return true;
		});
	}

	itemCopy.name = itemName;

	return itemCopy;
};

controller.getItems = () => {
	return allItems;
};

controller.getCreatures = () => {
	return creatures;
};

controller.getUpgrades = () => {
	return upgradesData;
};

controller.getAllBlueprints = () => {
	return allBlueprints;
};

controller.getTranslator = () => {
	return translator;
};

controller.getIngredientsFromItem = (data, key) => {
	const ingredient = { ...ingredienTemplate };
	ingredient.name = data[key]?.Key
		? dataParser.parseName(translator, data[key]?.Key)
		: dataParser.parseName(translator, Object.keys(data[key])[0]);
	ingredient.count = data[key]?.Key
		? data[key]?.Value
		: Object.values(data[key])[0];

	return ingredient;
};

module.exports = controller;
