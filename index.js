const fs = require("fs");
const path = require("path");
const comparator = require("./helpers/comparator");
const translator = require("./helpers/translator");

let allItems = [];

translator.initownTranslations();

const folderType = ["tech", "item", "translation", "trade", "placeables"];

const itemTemplate = {
  category: undefined,
  cost: undefined,
  crafting: undefined,
  damage: undefined,
  name: undefined,
  parent: undefined,
  trade_price: undefined,
  translation: undefined,
};
const recipeTemplate = {
  ingredients: [],
  output: undefined,
  station: undefined,
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

loadDirData("./Data/StringTables", 2);
loadDirData("./Data/TechTree", 0);
loadDirData("./Data/Items", 1);
loadDirData("./Data/Placeables", 4);
loadDirData("./Data/Recipes", 1);
loadDirData("./Data/Trade", 3);

allItems = translator.translateItems(allItems);

allItems.forEach((item) => {
  Object.keys(item).forEach((key) => {
    if (item[key] === undefined) {
      delete item[key];
    } else if (item["translation"] != undefined) {
      delete item["translation"];
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
  fs.writeFile("./items.json", JSON.stringify(allItems), function (err) {
    if (err) {
      console.error("Error creating the file");
    } else {
      console.log("Data exported");
    }
  });
}

comparator.compareItems(allItems);

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

function parseItemData(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = getItem(parseName(jsonData[1].Type));

    if (jsonData[1].Properties) {
      if (jsonData[1].Properties?.Category?.ObjectPath) {
        item.category = parseCategory(
          jsonData[1].Properties.Category.ObjectPath
        );
      }
      if (jsonData[1].Properties?.ExpectedPrice) {
        item.trade_price = jsonData[1].Properties.ExpectedPrice;
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

      if (jsonData[1].Properties?.Name?.Key) {
        item.translation = jsonData[1].Properties.Name.Key.replace(
          ".Name",
          ""
        ).trim();
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
    if (
      jsonData[1].Properties &&
      jsonData[1].Properties.Requirements &&
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
    allItems.push(item);
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

function parseName(name) {
  name = name.replace("BlueprintGeneratedClass", "").trim();
  name = name.replace(".0", "").trim();
  let dot = name.indexOf(".");
  if (dot > 0) {
    name = name.slice(dot + 1);
  }
  name = name.replace("_C", "").trim();
  name = translator.translateName(name);

  if (name.includes("Walker")) {
    if (/(.+) Walker/.test(name)) {
      name = name + " Body";
    } else if (/(.+)Walker(.+)Legs/.test(name)) {
      let match = name.match(/(.+)Walker(.+)Legs/);
      if (match[1] != null && match[2] != null) {
        let walkerName = translator.translateName(match[1] + "Walker");
        let legType = match[2] != "Base" ? match[2] + " (1 of 2)" : "";
        name = walkerName + " Legs " + legType;
      }
    } else if (/(.+)WalkerWings(.+)/.test(name)) {
      let match = name.match(/(.+)WalkerWings(.+)/);
      if (match[1] != null && match[2] != null) {
        let walkerName = translator.translateName(match[1] + "Walker");
        let wingsType = "Wings (1 of 2)";
        switch (match[2]) {
          case "FastSmall":
            wingsType = "Wings Small (1 of 2)";
            break;
          case "FastMedium":
            wingsType = "Wings Medium (1 of 2)";
            break;
          case "FastLarge":
            wingsType = "Wings Large (1 of 2)";
            break;
          case "Heavy1":
            wingsType = "Wings Heavy (1 of 2)";
            break;
          case "Heavy2":
            wingsType = "Wings Rugged (1 of 2)";
            break;
          case "Skirmish1":
            wingsType = "Wings Skirmish (1 of 2)";
            break;
          case "Skirmish2":
            wingsType = "Wings Raider (1 of 2)";
            break;
        }
        name = walkerName + " " + wingsType;
      }
    }
  }
  if (name.includes("Upgrades")) {
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
