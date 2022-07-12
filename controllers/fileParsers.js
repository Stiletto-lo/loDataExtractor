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

const EXTRACT_ALL_DATA = false;

let allItems = [];
let upgradesData = [];

controller.parseLootTable = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[0]) {
    let location = "";
    if (jsonData[0].Name) {
      location = jsonData[0].Name;
    }
    if (jsonData[0].Rows) {
      let lootItems = jsonData[0].Rows;
      Object.keys(lootItems).forEach((key) => {
        if (lootItems[key].Item) {
          let drop = { ...dropTemplate };
          let item = controller.getItem(dataParser.parseName(translator, key));
          if (item) {
            let itemDrops = item.drops;
            let hasDrop = itemDrops.some((drop) => drop.location === location);
            if (!hasDrop) {
              drop.location = location;
              if (lootItems[key].Chance) {
                drop.chance = lootItems[key].Chance;
              }
              if (lootItems[key].MinQuantity) {
                drop.minQuantity = lootItems[key].MinQuantity;
              }
              if (lootItems[key].MaxQuantity) {
                drop.maxQuantity = lootItems[key].MaxQuantity;
              }
              itemDrops.push(drop);
              item.drops = itemDrops;
            }

            allItems.push(item);
          }
        }
      });
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
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = controller.getItem(
      dataParser.parseName(translator, jsonData[1].Type)
    );
    item.type = jsonData[1].Type;

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

      if (EXTRACT_ALL_DATA && jsonData[1].Properties?.Weight) {
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
          item.translation = jsonData[1].Properties.Name.SourceString.trim();
        } else {
          item.translation = jsonData[1].Properties.Name.Key.replace(
            ".Name",
            ""
          ).trim();
        }
      }
    }

    allItems.push(item);
  }
};

controller.parsePlaceableData = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = controller.getItem(
      dataParser.parseName(translator, jsonData[1].Type)
    );
    item.type = jsonData[1].Type;

    if (jsonData[1].Properties) {
      if (jsonData[1].Properties?.Category?.ObjectPath) {
        item.category = dataParser.parseCategory(
          jsonData[1].Properties.Category.ObjectPath
        );
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

      if (jsonData[1].Properties?.Name?.SourceString) {
        item.name = jsonData[1].Properties.Name.SourceString.trim();
      } else if (jsonData[1].Properties?.Name?.Key) {
        item.translation = jsonData[1].Properties.Name.Key.replace(
          ".Name",
          ""
        ).trim();
      }
    }

    allItems.push(item);
  }
};

controller.parseTechData = (filePath, show_dev = false) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = controller.getItem(
      dataParser.parseName(translator, jsonData[1].Type)
    );
    item.type = jsonData[1].Type;

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

    if (jsonData[1]?.Properties?.bHidden && !show_dev) {
      item.parent = undefined;
    }
    allItems.push(item);
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
        let item = controller.getItem(
          dataParser.parseName(translator, order.ItemClass.ObjectName)
        );

        if (order.Price > item.trade_price) {
          item.trade_price = order.Price;
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
    if (item) {
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

controller.getItem = (itemName) => {
  let itemCopy = { ...itemTemplate };
  allItems = allItems.filter((item) => {
    if (
      item.name == itemName ||
      (item.translation && item.translation == itemName)
    ) {
      itemCopy = item;
      return false;
    }
    return true;
  });
  itemCopy.name = itemName;

  return itemCopy;
};

controller.getItems = () => {
  return allItems;
};

controller.getUpgrades = () => {
  return upgradesData;
};

controller.getTranslator = () => {
  return translator;
};

module.exports = controller;
