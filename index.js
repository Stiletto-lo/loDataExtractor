const fs = require("fs");
const path = require("path");
const comparator = require("./helpers/comparator");
const translator = require("./helpers/translator");

let allItems = [];
const SHOW_DEV_ITEMS = false;

translator.initownTranslations();

const folderPatch = "./exported/";

const folderType = [
  "tech",
  "item",
  "translation",
  "trade",
  "placeables",
  "cached",
  "loottables",
];

const itemTemplate = {
  category: undefined,
  cost: undefined,
  crafting: undefined,
  name: undefined,
  parent: undefined,
  trade_price: undefined,
  translation: undefined,
  type: undefined,
  description: undefined,
  projectileDamage: undefined,
  experiencieReward: undefined,
  stackSize: undefined,
  weight: undefined,
  durability: undefined,
  weaponInfo: undefined,
  toolInfo: undefined,
  schematicName: undefined,
  armorInfo: undefined,
  movementSpeedReduction: undefined,
  drops: [],
  structureInfo: undefined,
};

const weaponInfoTemplate = {
  durabilityDamage: undefined,
  weaponSpeed: undefined,
  impact: undefined,
  stability: undefined,
  weaponLength: undefined,
  damage: undefined,
  penetration: undefined,
};

const toolInfoTemplate = {
  toolType: undefined,
  tier: undefined,
};

const projectileDamageTemplate = {
  damage: undefined,
  penetration: undefined,
  effectivenessVsSoak: undefined,
  effectivenessVsReduce: undefined,
};

const recipeTemplate = {
  ingredients: [],
  output: undefined,
  station: undefined,
  time: undefined,
};

const dropTemplate = {
  location: undefined,
  chance: undefined,
  minQuantity: undefined,
  maxQuantity: undefined,
};

const armorInfoTemplate = {
  soak: undefined,
  reduce: undefined,
};

const structureInfoTemplate = {
  type: undefined,
  hp: undefined,
};

const ingredienTemplate = { count: undefined, name: undefined };

const costTemplate = {
  count: undefined,
  name: undefined,
};

const orderByCategory = (a, b) => {
  if (a.category < b.category) {
    return -1;
  } else if (a.category > b.category) {
    return 1;
  }
  return 0;
};

loadDirData("./Content/Mist/Data/StringTables", 2);
loadDirData("./Content/Mist/Data/TechTree", 0);
loadDirData("./Content/Mist/Data/Items", 1);
loadDirData("./Content/Mist/Data/Placeables", 4);
loadDirData("./Content/Mist/Data/Recipes", 1);
loadDirData("./Content/Mist/Data/Trade", 3);
loadDirData("./Content/Mist/Data/Placeables", 5);
//loadDirData("./Content/Mist/Data/LootTables", 6);

allItems = translator.translateItems(allItems);
allItems = translator.addDescriptions(allItems);

allItems.forEach((item) => {
  item = fixParentItem(item);
  Object.keys(item).forEach((key) => {
    if (item[key] === undefined) {
      delete item[key];
    } else if (item["translation"] != undefined) {
      delete item["translation"];
    } else if (item["type"] != undefined) {
      delete item["type"];
    } else if (item["schematicName"] != undefined) {
      delete item["schematicName"];
    } else if (item["drops"] != undefined && item["drops"].length <= 0) {
      delete item["drops"];
    }
  });
});

allItems = allItems
  .map((item) => {
    let countItems = allItems.filter((item2) => item.name == item2.name);
    if (countItems.length > 1) {
      return { ...countItems[0], ...countItems[1] };
    }
    return item;
  })
  .filter((item) => item.name && Object.keys(item).length > 2)
  .reduce((acc, current) => {
    const x = acc.find((item) => item.name === current.name);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

allItems.sort(orderByCategory);

if (allItems.length > 0) {
  fs.writeFile(
    folderPatch + "itemsDetailed.json",
    JSON.stringify(allItems, null, 2),
    function (err) {
      if (err) {
        console.error("Error creating the file");
      } else {
        console.log("Data exported");
      }
    }
  );
}

/* We remove additional information */
allItems.forEach((item) => {
  item.description = undefined;
  item.projectileDamage = undefined;
  item.experiencieReward = undefined;
  item.stackSize = undefined;
  item.weight = undefined;
  item.durability = undefined;
  item.weaponInfo = undefined;
  item.toolInfo = undefined;
  item.schematicName = undefined;
  item.drops = undefined;
  item.armorInfo = undefined;
  item.movementSpeedReduction = undefined;
  item.structureInfo = undefined;
});

if (allItems.length > 0) {
  fs.writeFile(
    folderPatch + "items.json",
    JSON.stringify(allItems, null, 2),
    function (err) {
      if (err) {
        console.error("Error creating the file");
      } else {
        console.log("Data exported");
      }
    }
  );
}

comparator.compareItems(allItems, folderPatch);

function loadDirData(techTreeDir, folderType = 0) {
  let dir = path.join(__dirname, techTreeDir);
  let files = fs.readdirSync(dir);
  files.forEach((file) => {
    let fileData = fs.statSync(techTreeDir + "/" + file);
    if (fileData.isDirectory()) {
      loadDirData(techTreeDir + "/" + file, folderType);
    } else if (file.includes(".json")) {
      switch (folderType) {
        case 0:
          parseTechData(techTreeDir + "/" + file);
          break;
        case 1:
          parseItemData(techTreeDir + "/" + file);
          break;
        case 2:
          parseTranslations(techTreeDir + "/" + file);
          break;
        case 3:
          parsePrices(techTreeDir + "/" + file);
          break;
        case 4:
          parsePlaceableData(techTreeDir + "/" + file);
          break;
        case 5:
          if (file.includes("CachedPlaceablesCosts.json")) {
            parseCachedItems(techTreeDir + "/" + file);
          }
          break;
        case 6:
          parseLootTable(techTreeDir + "/" + file);
          break;
      }
    }
  });
}

function getItem(itemName) {
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
}

function parseLootTable(filePath) {
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
          let item = getItem(parseName(key));
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
}

function parseCachedItems(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[0] && jsonData[0]?.Properties.CachedTotalCost) {
    let cachedItems = jsonData[0].Properties.CachedTotalCost;
    Object.keys(cachedItems).forEach((key) => {
      if (cachedItems[key].Inputs) {
        let recipe = { ...recipeTemplate };
        let item = getItem(parseName(key));
        let ingredients = [];
        for (const ingredientKey in cachedItems[key].Inputs) {
          let ingredient = { ...ingredienTemplate };
          ingredient.name = parseName(ingredientKey);
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
}

function parseItemData(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = getItem(parseName(jsonData[1].Type));
    item.type = jsonData[1].Type;

    if (jsonData[1].Properties) {
      if (jsonData[1].Properties?.Category?.ObjectPath) {
        let category = parseCategory(
          jsonData[1].Properties.Category.ObjectPath
        );
        if (category.includes("Schematics")) {
          item.schematicName = jsonData[1].Type;
        } else {
          item.category = parseCategory(
            jsonData[1].Properties.Category.ObjectPath
          );
        }
      }
      if (jsonData[1].Properties?.ExpectedPrice) {
        item.trade_price = jsonData[1].Properties.ExpectedPrice;
      }

      if (jsonData[1].Properties?.MovementSpeedReduction) {
        item.movementSpeedReduction =
          jsonData[1].Properties.MovementSpeedReduction;
      }

      if (jsonData[1].Properties?.ProjectileDamage) {
        let projectileDamage = { ...projectileDamageTemplate };

        projectileDamage.damage = jsonData[1].Properties?.ProjectileDamage
          ?.Damage
          ? jsonData[1].Properties?.ProjectileDamage?.Damage
          : undefined;
        projectileDamage.penetration = jsonData[1].Properties?.ProjectileDamage
          ?.Penetration
          ? jsonData[1].Properties?.ProjectileDamage?.Penetration
          : undefined;
        projectileDamage.effectivenessVsSoak = jsonData[1].Properties
          ?.ProjectileDamage?.EffectivenessVsSoak
          ? jsonData[1].Properties?.ProjectileDamage?.EffectivenessVsSoak
          : undefined;
        projectileDamage.effectivenessVsReduce = jsonData[1].Properties
          ?.ProjectileDamage?.EffectivenessVsReduce
          ? jsonData[1].Properties?.ProjectileDamage?.EffectivenessVsReduce
          : undefined;

        item.projectileDamage = projectileDamage;
      }

      if (jsonData[1].Properties?.DefenseProperties) {
        let armorInfo = { ...armorInfoTemplate };

        armorInfo.soak = jsonData[1].Properties?.DefenseProperties?.Soak
          ? jsonData[1].Properties?.DefenseProperties?.Soak
          : undefined;
        armorInfo.reduce = jsonData[1].Properties?.DefenseProperties?.Reduce
          ? jsonData[1].Properties?.DefenseProperties?.Reduce
          : undefined;

        item.armorInfo = armorInfo;
      }

      if (jsonData[1].Properties?.ExperienceRewardCrafting) {
        item.experiencieReward =
          jsonData[1].Properties.ExperienceRewardCrafting;
      }

      if (jsonData[1].Properties?.MaxStackSize) {
        item.stackSize = jsonData[1].Properties.MaxStackSize;
      }

      if (jsonData[1].Properties?.Weight) {
        item.weight = jsonData[1].Properties.Weight;
      }

      if (jsonData[1].Properties?.MaxDurability) {
        item.durability = jsonData[1].Properties.MaxDurability;
      }

      let weaponInfo = { ...weaponInfoTemplate };

      if (jsonData[1].Properties?.DurabilityDamage) {
        weaponInfo.durabilityDamage = jsonData[1].Properties.DurabilityDamage;
        item.weaponInfo = weaponInfo;
      }
      if (jsonData[1].Properties?.WeaponSpeed) {
        weaponInfo.weaponSpeed = jsonData[1].Properties.WeaponSpeed;
        item.weaponInfo = weaponInfo;
      }
      if (jsonData[1].Properties?.Impact) {
        weaponInfo.impact = jsonData[1].Properties.Impact;
        item.weaponInfo = weaponInfo;
      }
      if (jsonData[1].Properties?.Stability) {
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
        let toolInfos = [];

        toolInfosData.forEach((toolInfoData) => {
          let toolInfo = { ...toolInfoTemplate };
          toolInfo.tier = toolInfoData.Tier;
          if (toolInfoData.ToolType.includes("TreeCutting")) {
            toolInfo.toolType = "TreeCutting";
          } else if (toolInfoData.ToolType.includes("Scythe")) {
            toolInfo.toolType = "Scythe";
          } else if (toolInfoData.ToolType.includes("Mining")) {
            toolInfo.toolType = "Mining";
          } else {
            toolInfo.toolType = toolInfoData.ToolType.replace(
              "EEquipmentTool::",
              ""
            );
          }
          toolInfos.push(toolInfo);
        });

        item.toolInfo = toolInfos;
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
              ingredient.name = parseName(key);
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
            recipe.station = parseName(recipeData.Category.ObjectName).trim();
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
}

function parsePlaceableData(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = getItem(parseName(jsonData[1].Type));
    item.type = jsonData[1].Type;

    if (jsonData[1].Properties) {
      if (jsonData[1].Properties?.Category?.ObjectPath) {
        item.category = parseCategory(
          jsonData[1].Properties.Category.ObjectPath
        );
      }

      if (jsonData[1].Properties?.Requirements) {
        let recipeData = jsonData[1].Properties.Requirements;
        if (recipeData.Inputs) {
          let recipe = { ...recipeTemplate };
          let ingredients = [];
          for (const key in recipeData.Inputs) {
            let ingredient = { ...ingredienTemplate };
            ingredient.name = parseName(key);
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

      /*if (jsonData[1].Properties?.Name?.Key) {
        item.translation = jsonData[1].Properties.Name.Key.replace(
          ".Name",
          ""
        ).trim();
      }*/
      if (jsonData[1].Properties?.Name?.SourceString) {
        item.name = jsonData[1].Properties.Name.SourceString.trim();
      }
    }

    allItems.push(item);
  }
}

function parseTechData(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = getItem(parseName(jsonData[1].Type));
    item.type = jsonData[1].Type;

    if (
      jsonData[1]?.Properties?.Requirements &&
      jsonData[1].Properties.Requirements[0] &&
      jsonData[1].Properties.Requirements[0].ObjectName
    ) {
      item.parent = parseName(
        jsonData[1].Properties.Requirements[0].ObjectName
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

    if (!jsonData[1]?.Properties?.bHidden || SHOW_DEV_ITEMS) {
      allItems.push(item);
    }
  }
}

function parseTranslations(filePath) {
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
}

function parsePrices(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[1]?.Properties?.OrdersArray) {
    let allOrders = jsonData[1].Properties.OrdersArray;

    allOrders.forEach((order) => {
      if (order?.ItemClass?.ObjectName && order?.Price) {
        let item = getItem(parseName(order.ItemClass.ObjectName));

        if (order.Price > item.trade_price) {
          item.trade_price = order.Price;
        }

        allItems.push(item);
      }
    });
  }
}

function parseCategory(category) {
  category = category
    .replace("Mist/Content/Mist/Data/Items/Categories/", "")
    .trim();
  category = category.replace(".0", "").trim();
  return category;
}

function parseType(name) {
  name = name.replace("BlueprintGeneratedClass", "").trim();
  name = name.replace(".0", "").trim();
  let dot = name.indexOf(".");
  if (dot > 0) {
    name = name.slice(dot + 1);
  }
  return name;
}

function parseName(name) {
  name = parseType(name);
  name = name.replace("_C", "").trim();
  name = translator.translateName(name);

  if (/(.+)Legs/.test(name)) {
    let match = name.match(/(.+)Legs/);
    if (match[1] != null) {
      let walkerName = translator.translateName(match[1] + " Walker");
      let legType = "";
      if (name.includes("_T2")) {
        legType = "Armored ";
      } else if (name.includes("_T3")) {
        legType = "Heavy ";
      }
      name = walkerName + " Legs " + legType + "(1 of 2)";
    }
  } else if (/(.+) Walker/.test(name) && !name.includes("Body")) {
    name = name + " Body";
  } else if (/(.+)Wings/.test(name)) {
    let match = name.match(/(.+)Wings/);
    if (match[1] != null) {
      let walkerName = translator.translateName(match[1] + " Walker");
      let wingsType = "Wings (1 of 2)";
      if (name.includes("_T2_Small")) {
        wingsType = "Wings Small (1 of 2)";
      } else if (name.includes("_T3_Medium")) {
        wingsType = "Wings Medium (1 of 2)";
      } else if (name.includes("_T4")) {
        wingsType = "Wings Large (1 of 2)";
      } else if (name.includes("_T2_Heavy")) {
        wingsType = "Wings Heavy (1 of 2)";
      } else if (name.includes("_T3_Rugged")) {
        wingsType = "Wings Rugged (1 of 2)";
      } else if (name.includes("_T2_Skirmish")) {
        wingsType = "Wings Skirmish (1 of 2)";
      } else if (name.includes("_T3_Raider")) {
        wingsType = "Wings Raider (1 of 2)";
      }

      name = walkerName + " " + wingsType;
    }
  } else if (name.includes("Upgrades")) {
    if (/(.+)Walker(.+)Upgrades/.test(name)) {
      let match = name.match(/(.+)Walker(.+)Upgrades/);
      if (match[1] != null && match[2] != null) {
        let walkerName = translator.translateName(match[1] + "Walker");
        let tier = "1";
        switch (match[2]) {
          case "Bone":
            tier = "2";
            break;
          case "Ceramic":
            tier = "3";
            break;
          case "Iron":
            tier = "4";
            break;
        }
        name = walkerName + " Upgrade - Water - Tier " + tier;
      }
    } else if (/(.+)BoneUpgrades/.test(name)) {
      let match = name.match(/(.+)BoneUpgrades/);
      if (match[1] != null) {
        let walkerName = translator.translateName(match[1] + "Walker");
        name = walkerName + " Upgrade - Water - Tier 2";
      }
    } else if (/(.+)CeramicUpgrades/.test(name)) {
      let match = name.match(/(.+)CeramicUpgrades/);
      if (match[1] != null) {
        let walkerName = translator.translateName(match[1] + "Walker");
        name = walkerName + " Upgrade - Water - Tier 3";
      }
    } else if (/(.+)IronUpgrades/.test(name)) {
      let match = name.match(/(.+)IronUpgrades/);
      if (match[1] != null) {
        let walkerName = translator.translateName(match[1] + "Walker");
        name = walkerName + " Upgrade - Water - Tier 4";
      }
    }
  }

  return name.trim();
}

function fixParentItem(item) {
  if (
    item.category &&
    item.category.includes("WalkerParts") &&
    item.parent &&
    !item.parent.includes("Body") &&
    !item.parent.includes("Legs") &&
    !item.parent.includes("Wings")
  ) {
    item.parent = item.parent + " Walker Body";
  }
  return item;
}
