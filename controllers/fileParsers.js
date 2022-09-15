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

const EXTRACT_ALL_DATA = process.env.EXTRACT_ALL_DATA === "true";
const SHOW_DEV_ITEMS = process.env.SHOW_DEV_ITEMS === "true";
const DEBUG = process.env.DEBUG === "true";

let allItems = [];
let upgradesData = [];

let allDatatables = [];
let allBlueprints = [];

controller.parseBlueprintsToItems = () => {
  allBlueprints.forEach((blueprint) => {
    let location = translator.translateLootSite(blueprint.name);
    blueprint.tables.forEach((dataTable) => {
      let dataTableChance = 100;
      let minIterations = 1;
      let maxIterations = 1;
      if (dataTable.minIterations) {
        minIterations = dataTable.minIterations;
      }
      if (dataTable.maxIterations) {
        maxIterations = dataTable.minIterations;
      }
      if (dataTable.dataTableChance) {
        dataTableChance = dataTable.dataTableChance;
      }

      let minChance = (dataTableChance * minIterations) / 100;
      let maxChance = (dataTableChance * maxIterations) / 100;

      dataTable.dropItems.forEach((lootItemData) => {
        let item = controller.getItem(
          dataParser.parseName(translator, lootItemData.name)
        );
        if (item && item.name) {
          let itemDrops = item.drops ? item.drops : [];
          let hasDrop = itemDrops.some((d) => d.location === location);
          if (!hasDrop && item.name != location) {
            let drop = { ...dropTemplate };
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
  });
};

controller.parseLootTable = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (
    jsonData[0].Type &&
    jsonData[0].Name &&
    jsonData[0].Rows &&
    jsonData[0].Type == "DataTable"
  ) {
    let dataTable = { ...dataTableTemplate };
    dataTable.name = dataParser.parseName(translator, jsonData[0].Name);
    let lootItems = jsonData[0].Rows;
    let dataTableItems = [];
    Object.keys(lootItems).forEach((key) => {
      if (lootItems[key].Item) {
        let name = dataParser.parseName(translator, key);
        if (name) {
          let completeItem = controller.getItemByType(
            dataParser.parseType(lootItems[key].Item.AssetPathName)
          );
          if (completeItem && completeItem.name) {
            name = completeItem.name;
          } else if (
            lootItems[key].Item.AssetPathName &&
            lootItems[key].Item.AssetPathName.includes("Schematics")
          ) {
            name = name + " Schematic";
          }
          let hasDrop = dataTable.dropItems.some((d) => d.name === name);
          if (!hasDrop && name != dataTable.name) {
            let drop = { ...dropDataTemplate };
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
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (
    jsonData[0].Type &&
    jsonData[0].Name &&
    jsonData[0].Type == "BlueprintGeneratedClass"
  ) {
    if (jsonData[1]?.Type) {
      let blueprint = { ...blueprintTemplate };
      blueprint.name = dataParser.parseName(translator, jsonData[1].Type);
      if (jsonData[1]?.Properties?.Loot?.Tables) {
        let allBlueprintTables = [];
        let tables = jsonData[1].Properties.Loot.Tables;
        tables.forEach((table) => {
          if (table?.Table?.ObjectPath) {
            let name = dataParser.parseName(translator, table.Table.ObjectName);
            let dataTable = allDatatables.find((data) => data.name == name);
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
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[0] && jsonData[0]?.Properties.CachedTotalCost) {
    let cachedItems = jsonData[0].Properties.CachedTotalCost;
    Object.keys(cachedItems).forEach((key) => {
      if (cachedItems[key].Inputs) {
        let recipe = { ...recipeTemplate };
        let item = controller.getItem(dataParser.parseName(translator, key));
        let ingredients = [];
        for (const ingredientKey in cachedItems[key].Inputs) {
          let ingredient = { ...ingredienTemplate };
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

controller.parseItemData = (filePath) => {
  if (filePath.includes("Schematics")) {
    return;
  }
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = controller.extractItemByType(jsonData[1].Type);

    if (jsonData[1].Properties) {
      if (jsonData[1].Properties?.Category?.ObjectPath) {
        let category = dataParser.parseCategory(
          jsonData[1].Properties.Category.ObjectPath
        );
        if (category.includes("Schematics")) {
          item.schematicName = jsonData[1].Type;
        } else {
          item.category = dataParser.parseCategory(
            jsonData[1].Properties.Category.ObjectPath
          );
        }
      }
      if (jsonData[1].Properties?.ExpectedPrice) {
        item.trade_price = jsonData[1].Properties.ExpectedPrice;
      }

      if (jsonData[1].Properties?.MaximumQuantity) {
        if (item.moduleInfo == undefined) {
          let moduleInfoBase = { ...moduleInfoTemplate };
          item.moduleInfo = moduleInfoBase;
        }

        item.moduleInfo.max = jsonData[1].Properties.MaximumQuantity;
        item.moduleInfo.increase = jsonData[1].Properties
          .AbsoluteIncreasePerItem
          ? jsonData[1].Properties.AbsoluteIncreasePerItem
          : undefined;
      }

      if (jsonData[1].Properties?.PercentageIncreasePerItem) {
        if (item.moduleInfo == undefined) {
          let moduleInfoBase = { ...moduleInfoTemplate };
          item.moduleInfo = moduleInfoBase;
        }

        item.moduleInfo.increase =
          jsonData[1].Properties.PercentageIncreasePerItem;
        item.moduleInfo.maxIncrease = jsonData[1].Properties.MaximumPercentage
          ? jsonData[1].Properties.MaximumPercentage
          : undefined;
      }

      if (jsonData[1].Properties?.ProjectileDamage) {
        let projectileDamage = { ...projectileDamageTemplate };

        projectileDamage.damage = jsonData[1].Properties?.ProjectileDamage
          ?.Damage
          ? jsonData[1].Properties?.ProjectileDamage?.Damage
          : undefined;
        projectileDamage.penetration =
          EXTRACT_ALL_DATA &&
          jsonData[1].Properties?.ProjectileDamage?.Penetration
            ? jsonData[1].Properties?.ProjectileDamage?.Penetration
            : undefined;
        projectileDamage.effectivenessVsSoak =
          EXTRACT_ALL_DATA &&
          jsonData[1].Properties?.ProjectileDamage?.EffectivenessVsSoak
            ? jsonData[1].Properties?.ProjectileDamage?.EffectivenessVsSoak
            : undefined;
        projectileDamage.effectivenessVsReduce =
          EXTRACT_ALL_DATA &&
          jsonData[1].Properties?.ProjectileDamage?.EffectivenessVsReduce
            ? jsonData[1].Properties?.ProjectileDamage?.EffectivenessVsReduce
            : undefined;

        item.projectileDamage = projectileDamage;
      }

      if (jsonData[1].Properties?.DefenseProperties) {
        let armorInfo = { ...armorInfoTemplate };

        armorInfo.absorbing = jsonData[1].Properties?.DefenseProperties?.Soak
          ? jsonData[1].Properties?.DefenseProperties?.Soak
          : undefined;
        armorInfo.reduction = jsonData[1].Properties?.DefenseProperties?.Reduce
          ? jsonData[1].Properties?.DefenseProperties?.Reduce
          : undefined;

        if (jsonData[1].Properties?.MovementSpeedReduction) {
          armorInfo.speedReduction =
            jsonData[1].Properties.MovementSpeedReduction;
        }

        item.armorInfo = armorInfo;
      }

      if (
        EXTRACT_ALL_DATA &&
        jsonData[1].Properties?.ExperienceRewardCrafting
      ) {
        item.experiencieReward =
          jsonData[1].Properties.ExperienceRewardCrafting;
      }

      if (jsonData[1].Properties?.MaxStackSize) {
        item.stackSize = jsonData[1].Properties.MaxStackSize;
      }

      if (jsonData[1].Properties?.Weight) {
        item.weight = jsonData[1].Properties.Weight;
      }

      if (EXTRACT_ALL_DATA && jsonData[1].Properties?.MaxDurability) {
        item.durability = jsonData[1].Properties.MaxDurability;
      }

      let weaponInfo = { ...weaponInfoTemplate };

      if (EXTRACT_ALL_DATA && jsonData[1].Properties?.DurabilityDamage) {
        weaponInfo.durabilityDamage = jsonData[1].Properties.DurabilityDamage;
        item.weaponInfo = weaponInfo;
      }
      if (jsonData[1].Properties?.WeaponSpeed) {
        weaponInfo.weaponSpeed = jsonData[1].Properties.WeaponSpeed;
        item.weaponInfo = weaponInfo;
      }
      if (EXTRACT_ALL_DATA && jsonData[1].Properties?.Impact) {
        weaponInfo.impact = jsonData[1].Properties.Impact;
        item.weaponInfo = weaponInfo;
      }
      if (EXTRACT_ALL_DATA && jsonData[1].Properties?.Stability) {
        weaponInfo.stability = jsonData[1].Properties.Stability;
        item.weaponInfo = weaponInfo;
      }
      if (jsonData[1].Properties?.WeaponLength) {
        weaponInfo.weaponLength = jsonData[1].Properties.WeaponLength;
        item.weaponInfo = weaponInfo;
      }

      if (jsonData[1].Properties?.DamageProperties) {
        if (jsonData[1].Properties?.DamageProperties?.Damage) {
          weaponInfo.damage = jsonData[1].Properties.DamageProperties.Damage;
          item.weaponInfo = weaponInfo;
        }
        if (jsonData[1].Properties?.DamageProperties?.Penetration) {
          weaponInfo.penetration =
            jsonData[1].Properties.DamageProperties.Penetration;
          item.weaponInfo = weaponInfo;
        }
      }

      if (jsonData[1].Properties?.ToolInfo) {
        let toolInfosData = jsonData[1].Properties.ToolInfo;
        let toolInfos = item.toolInfo ? item.toolInfo : [];

        toolInfosData.forEach((toolInfoData) => {
          let baseToolInfo = { ...toolInfoTemplate };
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
              ""
            );
          }
          toolInfos.push(baseToolInfo);
        });
        if (toolInfos.length > 0) {
          item.toolInfo = toolInfos;
        }
      }

      if (jsonData[1].Properties?.Recipes) {
        let recipesData = jsonData[1].Properties.Recipes;
        let crafting = [];
        recipesData.forEach((recipeData) => {
          let recipe = { ...recipeTemplate };
          if (recipeData.Inputs) {
            let ingredients = [];
            for (const key in recipeData.Inputs) {
              let ingredient = { ...ingredienTemplate };
              ingredient.name = dataParser.parseName(translator, key);
              ingredient.count = recipeData.Inputs[key];
              ingredients.push(ingredient);
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
      if (jsonData[1].Properties.Name && jsonData[1].Properties.Name.Key) {
        if (
          jsonData[1].Properties.Name.SourceString &&
          jsonData[1].Properties.Name.SourceString.trim() != ""
        ) {
          item.name = jsonData[1].Properties.Name.SourceString.trim();
          item.translation = jsonData[1].Properties.Name.SourceString.trim();
        } else {
          item.translation = jsonData[1].Properties.Name.Key.replace(
            ".Name",
            ""
          ).trim();
        }
      }

      if (jsonData[1].Properties?.DamageType?.ObjectName) {
        item.damageType = dataParser.parseType(
          jsonData[1].Properties.DamageType.ObjectName
        );
      }
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

    allItems.push(item);
  }
};

controller.parseSchematicItemData = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = controller.extractItemByType(jsonData[1].Type);
    let name = undefined;
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

        let foundItem = controller.getItemByType(name);
        if (foundItem && foundItem.name) {
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

      let itemsSchematic = [];

      if (jsonData[1].Properties?.MaxStackSize) {
        item.stackSize = jsonData[1].Properties.MaxStackSize;
      }
      if (jsonData[1].Properties?.Items) {
        let allCraftingItems = jsonData[1].Properties.Items;
        allCraftingItems.forEach((schematicItem) => {
          if (schematicItem.AssetPathName) {
            let itemFound = controller.getItemByType(
              dataParser.parseType(schematicItem.AssetPathName)
            );
            if (itemFound) {
              itemsSchematic.push(itemFound.name);
            } else {
              let schematicItemName = dataParser.parseName(
                translator,
                schematicItem.AssetPathName
              );
              itemsSchematic.push(schematicItemName);
            }
          }
        });
      }
      if (jsonData[1].Properties?.Placeables) {
        let allCraftingPlaceables = jsonData[1].Properties.Placeables;
        allCraftingPlaceables.forEach((schematicPlaceable) => {
          if (schematicPlaceable.AssetPathName) {
            let itemFound = controller.getItemByType(
              dataParser.parseType(schematicPlaceable.AssetPathName)
            );
            if (itemFound) {
              itemsSchematic.push(itemFound.name);
            } else {
              let schematicPlaceableName = dataParser.parseName(
                translator,
                schematicPlaceable.AssetPathName
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
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = controller.extractItemByType(jsonData[1].Type);
    if (jsonData[1].Type.includes("Rig")) {
      let rigName = null;
      let wakerName = null;
      if (jsonData[1].Properties?.Name?.SourceString) {
        rigName = dataParser.parseName(
          translator,
          jsonData[1].Properties.Name.SourceString.trim()
        );
      } else if (jsonData[1].Properties?.Name?.Key) {
        rigName = dataParser.parseName(
          translator,
          jsonData[1].Properties.Name.Key.trim()
        );
      }
      if (jsonData[1].Properties?.Description?.Key) {
        wakerName = dataParser.parseName(
          translator,
          jsonData[1].Properties.Description.Key.trim()
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
          jsonData[1].Properties.Category.ObjectPath
        );
      } else if (jsonData[1].Type.includes("Rig")) {
        item.category = "Rigs";
      }

      if (jsonData[1].Properties?.FullCost) {
        let recipeData = jsonData[1].Properties.FullCost;
        if (recipeData.Inputs) {
          let recipe = { ...recipeTemplate };
          let ingredients = [];
          for (const key in recipeData.Inputs) {
            let ingredient = { ...ingredienTemplate };
            ingredient.name = dataParser.parseName(translator, key);
            ingredient.count = recipeData.Inputs[key];
            ingredients.push(ingredient);
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
        let structureInfo = { ...structureInfoTemplate };

        if (jsonData[1].Properties?.CachedCraftingPartsInfo?.MaxHP) {
          structureInfo.hp =
            jsonData[1].Properties.CachedCraftingPartsInfo.MaxHP;
          item.structureInfo = structureInfo;
        }
        if (jsonData[1].Properties?.CachedCraftingPartsInfo?.Protection) {
          structureInfo.type =
            jsonData[1].Properties.CachedCraftingPartsInfo.Protection.replace(
              "EMistMaterialProtection::",
              ""
            );
          item.structureInfo = structureInfo;
        }
      }

      if (jsonData[1].Properties?.WalkerCategory) {
        item.walkerinfo = {
          category: dataParser.parseCategory(
            jsonData[1].Properties.WalkerCategory
          ),
        };
      }

      if (
        jsonData[2] &&
        jsonData[2].Template &&
        jsonData[2].Template == "WalkerRig"
      ) {
        //item.rigDesign = "No data";
      }

      if (!jsonData[1].Type.includes("Rig")) {
        if (jsonData[1].Properties?.Name?.SourceString) {
          item.name = jsonData[1].Properties.Name.SourceString.trim();
        } else if (jsonData[1].Properties?.Name?.Key) {
          item.translation = jsonData[1].Properties.Name.Key.replace(
            ".Name",
            ""
          ).trim();
        }
      }

      if (
        !item.category &&
        item.translation &&
        item.translation.includes("WallsWoodLight")
      ) {
        item.category = "StructuralWoodLight";
      }

      if (item.category && item.category.includes("Structural")) {
        item.name = dataParser.parseStructureName(
          item.category,
          translator.translateItem(item).name
        );
        item.translation = undefined;
      }
    }

    allItems.push(item);
  }
};

controller.parseTechData = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = controller.extractItemByType(jsonData[1].Type);

    if (
      jsonData[1]?.Properties?.Requirements &&
      jsonData[1].Properties.Requirements[0] &&
      jsonData[1].Properties.Requirements[0].ObjectName
    ) {
      item.parent = translator.translateName(
        dataParser.parseName(
          translator,
          jsonData[1].Properties.Requirements[0].ObjectName
        )
      );
    }
    if (jsonData[1]?.Properties?.Cost != 1) {
      let itemCost = { ...costTemplate };
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
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[1]?.Type) {
    let damageTypeClass = jsonData[1].Type;
    let itemSearch = allItems.find(
      (item) => item.damageType == damageTypeClass
    );
    if (itemSearch) {
      let item = controller.getItem(itemSearch.name);
      if (item) {
        let proyectileDamage = item.projectileDamage
          ? item.projectileDamage
          : { ...projectileDamageTemplate };
        proyectileDamage.vsSoft = jsonData[1]?.Properties?.DamageAgainstSoft
          ? parseInt(jsonData[1].Properties.DamageAgainstSoft * 100, 10)
          : undefined;
        proyectileDamage.vsMedium = jsonData[1]?.Properties?.DamageAgainstMedium
          ? parseInt(jsonData[1].Properties.DamageAgainstMedium * 100, 10)
          : undefined;
        proyectileDamage.vsHard = jsonData[1]?.Properties?.DamageAgainstHard
          ? parseInt(jsonData[1].Properties.DamageAgainstHard * 100, 10)
          : undefined;
        proyectileDamage.vsReinforced = jsonData[1]?.Properties
          ?.DamageAgainstReinforced
          ? parseInt(jsonData[1].Properties.DamageAgainstReinforced * 100, 10)
          : undefined;
        proyectileDamage.vsSolid = jsonData[1]?.Properties?.DamageAgainstSolid
          ? parseInt(jsonData[1].Properties.DamageAgainstSolid * 100, 10)
          : undefined;

        item.projectileDamage = proyectileDamage;
        allItems.push(item);
      }
    }
  }
};

controller.parseTranslations = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[0]?.StringTable?.KeysToMetaData) {
    for (const key in jsonData[0].StringTable.KeysToMetaData) {
      if (key.includes(".Name")) {
        translator.addTranslation(
          key.replace(".Name", "").trim(),
          jsonData[0].StringTable.KeysToMetaData[key]
        );
      } else if (key.includes(".Description")) {
        translator.addDescription(
          key.replace(".Description", "").trim(),
          jsonData[0].StringTable.KeysToMetaData[key]
        );
      }
    }
  }
};

controller.parsePrices = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[1]?.Properties?.OrdersArray) {
    let allOrders = jsonData[1].Properties.OrdersArray;

    allOrders.forEach((order) => {
      if (order?.ItemClass?.ObjectName && order?.Price) {
        let item = controller.extractItemByType(
          dataParser.parseType(order.ItemClass.ObjectName)
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
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[0]?.Name) {
    let profile = dataParser.parseName(translator, jsonData[0].Name);
    let superUp = jsonData[0].Super
      ? dataParser.parseName(translator, jsonData[0].Super)
      : undefined;

    if (jsonData[1]?.Properties) {
      for (const key in jsonData[1]?.Properties) {
        if (key.includes("Upgrade")) {
          let enabled = jsonData[1]?.Properties[key]?.bIsEnabled
            ? jsonData[1].Properties[key].bIsEnabled
            : true;

          if (!enabled) {
            continue;
          }

          let upgrade = { ...upgradeTemplate };
          let upgradeInfo = { ...upgradeInfoTemplate };
          let upgradeInfoValid = false;

          upgrade.profile = profile;
          upgrade.super = superUp;
          upgrade.name = dataParser.parseName(translator, key);

          upgradeInfo.containerSlots = jsonData[1]?.Properties[key]
            ?.ContainerSlots
            ? jsonData[1].Properties[key].ContainerSlots
            : undefined;
          upgradeInfo.engineTorqueMultiplier = jsonData[1]?.Properties[key]
            ?.EngineTorqueMultiplier
            ? jsonData[1].Properties[key].EngineTorqueMultiplier
            : undefined;
          upgradeInfo.sprintingTorqueDiscount = jsonData[1]?.Properties[key]
            ?.SprintingTorqueDiscount
            ? jsonData[1].Properties[key].SprintingTorqueDiscount
            : undefined;
          upgradeInfo.additionalParts = jsonData[1]?.Properties[key]
            ?.AdditionalParts
            ? jsonData[1].Properties[key].AdditionalParts
            : undefined;
          upgradeInfo.sdditionalSlots = jsonData[1]?.Properties[key]
            ?.AdditionalSlots
            ? jsonData[1].Properties[key].AdditionalSlots
            : undefined;
          upgradeInfo.containerSlots = jsonData[1]?.Properties[key]
            ?.ContainerSlots
            ? jsonData[1].Properties[key].ContainerSlots
            : undefined;
          upgradeInfo.stackSizeOverride = jsonData[1]?.Properties[key]
            ?.StackSizeOverride
            ? jsonData[1].Properties[key].StackSizeOverride
            : undefined;
          upgradeInfo.bonusHp = jsonData[1]?.Properties[key]?.BonusHp
            ? jsonData[1].Properties[key].BonusHp
            : undefined;

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
            let recipeData = jsonData[1]?.Properties[key]?.Inputs;
            let recipe = { ...recipeTemplate };
            let ingredients = [];
            for (const keyInput in recipeData) {
              let ingredient = { ...ingredienTemplate };
              ingredient.name = dataParser.parseName(translator, keyInput);
              ingredient.count = recipeData[keyInput];
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
    let item = controller.getUpgradeItem(upgradePure);
    if (item && item.name) {
      allItems.push(item);
    }
  });
};

controller.getUpgradeItem = (upgradePure) => {
  if (upgradePure.super) {
    let superUpgrade = upgradesData.find(
      (up) => up.profile == upgradePure.super && up.name == upgradePure.name
    );
    let superUpgradeData = controller.getUpgradeItem(superUpgrade);
    if (superUpgradeData) {
      let item = { ...itemTemplate };
      item.category = "Upgrades";
      item.name = dataParser.parseUpgradeName(
        upgradePure.name,
        upgradePure.profile
      );
      item.upgradeInfo = {
        ...superUpgradeData.upgradeInfo,
        ...upgradePure.upgradeInfo,
      };
      if (upgradePure.crafting && superUpgradeData.crafting) {
        let recipe = { ...recipeTemplate };
        if (upgradePure.crafting[0].time) {
          recipe.time = upgradePure.crafting[0].time;
        } else if (superUpgradeData.crafting[0].time) {
          recipe.time = superUpgradeData.crafting[0].time;
        }

        if (
          upgradePure.crafting[0].ingredients &&
          superUpgradeData.crafting[0].ingredients
        ) {
          let ingredientsFiltered =
            superUpgradeData.crafting[0].ingredients.filter(
              (ingredient) =>
                !upgradePure.crafting[0].ingredients.some(
                  (i) => i.name == ingredient.name
                )
            );
          recipe.ingredients = [].concat(
            upgradePure.crafting[0].ingredients,
            ingredientsFiltered
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
    let item = { ...itemTemplate };
    item.category = "Upgrades";
    item.name = dataParser.parseUpgradeName(
      upgradePure.name,
      upgradePure.profile
    );
    item.upgradeInfo = upgradePure.upgradeInfo;
    item.crafting = upgradePure.crafting;
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

controller.getUpgrades = () => {
  return upgradesData;
};

controller.getAllBlueprints = () => {
  return allBlueprints;
};

controller.getTranslator = () => {
  return translator;
};

module.exports = controller;
