/**
 * Item parsers for handling item-related data
 */

const fs = require('fs');
const dataParser = require('../dataParsers');
const translator = require('../translator');

// Import templates
const itemTemplate = require('../../templates/item');
const weaponInfoTemplate = require('../../templates/weaponInfo');
const toolInfoTemplate = require('../../templates/toolInfo');
const projectileDamageTemplate = require('../../templates/projectileDamage');
const recipeTemplate = require('../../templates/recipe');
const armorInfoTemplate = require('../../templates/armorInfo');
const structureInfoTemplate = require('../../templates/structureInfo');
const moduleInfoTemplate = require('../../templates/moduleInfo');
const ingredienTemplate = require('../../templates/cost');

// Import utility functions
const utilityFunctions = require('./utilityFunctions');

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

  let item = oldItem ?? utilityFunctions.extractItemByType(itemData.Type);

  if (itemData.Properties) {
    if (itemData.Properties?.Category?.ObjectPath) {
      let category = dataParser.parseCategory(
        itemData.Properties.Category.ObjectPath
      );
      if (category.includes("Schematics")) {
        item.schematicName = itemData.Type;
      } else {
        item.category = dataParser.parseCategory(
          itemData.Properties.Category.ObjectPath
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
        let moduleInfoBase = { ...moduleInfoTemplate };
        item.moduleInfo = moduleInfoBase;
      }

      item.moduleInfo.max = itemData.Properties.MaximumQuantity;
      item.moduleInfo.increase = itemData.Properties
        .AbsoluteIncreasePerItem
        ? itemData.Properties.AbsoluteIncreasePerItem
        : undefined;
    }

    if (itemData.Properties?.PercentageIncreasePerItem) {
      if (item.moduleInfo == undefined) {
        let moduleInfoBase = { ...moduleInfoTemplate };
        item.moduleInfo = moduleInfoBase;
      }

      item.moduleInfo.increase =
        itemData.Properties.PercentageIncreasePerItem;
      item.moduleInfo.maxIncrease = itemData.Properties.MaximumPercentage
        ? itemData.Properties.MaximumPercentage
        : undefined;
    }

    if (itemData.Properties?.ProjectileDamage) {
      let projectileDamage = { ...projectileDamageTemplate };

      projectileDamage.damage = itemData.Properties?.ProjectileDamage
        ?.Damage
        ? itemData.Properties?.ProjectileDamage?.Damage
        : undefined;
      projectileDamage.penetration =
        EXTRACT_ALL_DATA &&
          itemData.Properties?.ProjectileDamage?.Penetration
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
      let armorInfo = { ...armorInfoTemplate };

      armorInfo.absorbing = itemData.Properties?.DefenseProperties?.Soak
        ? itemData.Properties?.DefenseProperties?.Soak
        : undefined;
      armorInfo.reduction = itemData.Properties?.DefenseProperties?.Reduce
        ? itemData.Properties?.DefenseProperties?.Reduce
        : undefined;

      if (itemData.Properties?.MovementSpeedReduction) {
        armorInfo.speedReduction =
          itemData.Properties.MovementSpeedReduction;
      }

      item.armorInfo = armorInfo;
    }

    if (
      EXTRACT_ALL_DATA &&
      itemData.Properties?.ExperienceRewardCrafting
    ) {
      item.experiencieReward =
        itemData.Properties.ExperienceRewardCrafting;
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

    let weaponInfo = { ...weaponInfoTemplate };

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
      let toolInfosData = itemData.Properties.ToolInfo;
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

    if (itemData.Properties?.Recipes) {
      let recipesData = itemData.Properties.Recipes;
      let crafting = [];
      recipesData.forEach((recipeData) => {
        let recipe = { ...recipeTemplate };
        if (recipeData.Inputs) {
          let ingredients = [];
          for (const key in recipeData.Inputs) {
            ingredients.push(utilityFunctions.getIngredientsFromItem(recipeData.Inputs, key));
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
          ""
        ).trim();
        if (item.name == undefined) {
          item.name = dataParser.parseName(translator, item.translation);
        }
      }
    }

    if (itemData?.Properties?.DamageType?.ObjectName) {
      item.damageType = dataParser.parseType(
        itemData.Properties.DamageType.ObjectName
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

/**
 * Parse item data from a file
 * @param {string} filePath - The file path to parse
 */
const parseItemData = (filePath) => {
  if (filePath.includes("Schematics")) {
    return;
  }

  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1]?.Type) {
    let item = getItemFromItemData(jsonData[1]);

    if (!item?.name) {
      item = getItemFromItemData(jsonData?.[2], item);
    }

    utilityFunctions.getAllItems().push(item);
  }
};

/**
 * Parse schematic item data from a file
 * @param {string} filePath - The file path to parse
 */
const parseSchematicItemData = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData?.[1]?.Type) {
    let item = utilityFunctions.extractItemByType(jsonData[1].Type);
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

        let foundItem = utilityFunctions.getItemByType(name);
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

      let itemsSchematic = [];

      if (jsonData[1].Properties?.MaxStackSize) {
        item.stackSize = jsonData[1].Properties.MaxStackSize;
      }
      if (jsonData[1].Properties?.Items) {
        let allCraftingItems = jsonData[1].Properties.Items;
        allCraftingItems.forEach((schematicItem) => {
          if (schematicItem.AssetPathName) {
            let itemFound = utilityFunctions.getItemByType(
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
            let itemFound = utilityFunctions.getItemByType(
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
        utilityFunctions.getAllItems().push(item);
      }
    }
  }
};

/**
 * Parse placeable data from a file
 * @param {string} filePath - The file path to parse
 */
const parsePlaceableData = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData?.[1]?.Type) {
    let item = utilityFunctions.extractItemByType(jsonData[1].Type);
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
            ingredients.push(utilityFunctions.getIngredientsFromItem(recipeData.Inputs, key));
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
        let structureInfo = { ...structureInfoTemplate };

        if (jsonData[1].Properties?.CachedCraftingPartsInfo?.MaxHP) {
          structureInfo.hp =
            jsonData[1].Properties.CachedCraftingPartsInfo.MaxHP;
          item.structureInfo = structureInfo;
        }
        if (jsonData[1].Properties?.CachedCraftingPartsInfo?.Protection?.ObjectName) {
          structureInfo.type =
            jsonData[1].Properties.CachedCraftingPartsInfo.Protection?.ObjectName.replace(
              "Class'MistArmor",
              ""
            ).replace(
              "'",
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
        item?.translation?.includes?.("WallsWoodLight")
      ) {
        item.category = "StructuralWoodLight";
      }

      if (item?.category?.includes?.("Structural")) {
        item.name = dataParser.parseStructureName(
          item.category,
          translator.translateItem(item).name
        );
        item.translation = undefined;
      }
    }

    utilityFunctions.getAllItems().push(item);
  }
};

/**
 * Parse tech data from a file
 * @param {string} filePath - The file path to parse
 */
const parseTechData = (filePath) => {
  const EXTRACT_ALL_DATA = process.env.EXTRACT_ALL_DATA === "true";
  const SHOW_DEV_ITEMS = process.env.SHOW_DEV_ITEMS === "true";

  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData?.[1]?.Type) {
    let item = utilityFunctions.extractItemByType(jsonData[1].Type);

    if (
      jsonData?.[1]?.Properties?.Requirements?.[0]?.ObjectName
    ) {
      item.parent = translator.translateName(
        dataParser.parseName(
          translator,
          jsonData[1].Properties.Requirements[0].ObjectName
        )
      );
    }

    if (EXTRACT_ALL_DATA && jsonData[1]?.Properties?.Cost != 1) {
      let itemCost = { ...require('../../templates/cost') };
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

    utilityFunctions.getAllItems().push(item);
  }
};

/**
 * Parse damage data from a file
 * @param {string} filePath - The file path to parse
 */
const parseDamage = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[1]?.Type) {
    let damageTypeClass = jsonData[1].Type;
    let allItemsWithThatDamage = utilityFunctions.getAllItems().filter(
      (item) => item.damageType == damageTypeClass
    );
    allItemsWithThatDamage.forEach((itemSearch) => {
      let item = utilityFunctions.getItem(itemSearch.name);
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

        proyectileDamage = dataParser.cleanEmptyObject(proyectileDamage);
        if (proyectileDamage != null) {
          item.projectileDamage = proyectileDamage;
        }

        utilityFunctions.getAllItems().push(item);
      }
    });
  }
};

/**
 * Parse cached items data from a file
 * @param {string} filePath - The file path to parse
 */
const parseCachedItems = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[0]?.Properties?.CachedTotalCost) {
    let cachedItems = jsonData[0].Properties.CachedTotalCost;
    Object.keys(cachedItems).forEach((key) => {
      if (cachedItems[key].Inputs) {
        let recipe = { ...recipeTemplate };
        let item = utilityFunctions.getItem(dataParser.parseName(translator, key));
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
        utilityFunctions.getAllItems().push(item);
      }
    });
  }
};

/**
 * Parse prices data from a file
 * @param {string} filePath - The file path to parse
 */
const parsePrices = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[1]?.Properties?.OrdersArray) {
    let allOrders = jsonData[1].Properties.OrdersArray;

    allOrders.forEach((order) => {
      if (order?.ItemClass?.ObjectName && order?.Price) {
        let item = utilityFunctions.extractItemByType(
          dataParser.parseType(order.ItemClass.ObjectName)
        );

        if (order.Price > item.trade_price) {
          item.trade_price = order.Price;
        }

        if (!item.category && item.name == "ProxyLicense") {
          item.category = "Resources";
        }

        utilityFunctions.getAllItems().push(item);
      }
    });
  }
};

module.exports = {
  getItemFromItemData,
  parseItemData,
  parseSchematicItemData,
  parsePlaceableData,
  parseTechData,
  parseDamage,
  parseCachedItems,
  parsePrices
};