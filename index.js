const fs = require("fs");
const path = require("path");
const comparator = require("./comparator");

let allItems = [];
let allTranslations = [];

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
  name: undefined,
  count: undefined,
};

loadDirData("./Data/StringTables", 2);
loadDirData("./Data/TechTree", 0);
loadDirData("./Data/Items", 1);
loadDirData("./Data/Placeables", 4);
loadDirData("./Data/Recipes", 1);
loadDirData("./Data/Trade", 3);

translateItems();

allItems.forEach((item) => {
  Object.keys(item).forEach((key) => {
    if (item[key] === undefined) {
      delete item[key];
    } else if (item["translation"] != undefined) {
      delete item["translation"];
    }
  });
});

allItems = allItems.filter((item) => item.name && Object.keys(item).length > 1);

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
    } else {
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
    if (item.name == itemName) {
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
      if (
        jsonData[1].Properties.Category &&
        jsonData[1].Properties.Category.ObjectPath
      ) {
        item.category = parseCategory(
          jsonData[1].Properties.Category.ObjectPath
        );
      }
      if (jsonData[1].Properties.ExpectedPrice) {
        item.trade_price = jsonData[1].Properties.ExpectedPrice;
      }
      if (jsonData[1].Properties.Recipes) {
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
            recipeData.Category &&
            recipeData.Category.ObjectName &&
            !recipeData.Category.ObjectName.includes("Base")
          ) {
            recipe.station = parseName(recipeData.Category.ObjectName);
          }
          crafting.push(recipe);
        });
        if (crafting.length > 0) {
          item.crafting = crafting;
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
      if (
        jsonData[1].Properties.Category &&
        jsonData[1].Properties.Category.ObjectPath
      ) {
        item.category = parseCategory(
          jsonData[1].Properties.Category.ObjectPath
        );
      }

      if (jsonData[1].Properties.Requirements) {
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

      if (jsonData[1].Properties.Name && jsonData[1].Properties.Name.Key) {
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
    if (jsonData[1].Properties && jsonData[1].Properties.Cost) {
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
  if (
    jsonData[0] &&
    jsonData[0].StringTable &&
    jsonData[0].StringTable.KeysToMetaData
  ) {
    for (const key in jsonData[0].StringTable.KeysToMetaData) {
      if (key.includes(".Name")) {
        allTranslations[key.replace(".Name", "").trim()] =
          jsonData[0].StringTable.KeysToMetaData[key];
      }
    }
  }
}

function parsePrices(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (
    jsonData[1] &&
    jsonData[1].Properties &&
    jsonData[1].Properties.OrdersArray
  ) {
    let allOrders = jsonData[1].Properties.OrdersArray;

    allOrders.forEach((order) => {
      if (order.ItemClass && order.ItemClass.ObjectName && order.Price) {
        let item = getItem(parseName(order.ItemClass.ObjectName));

        item.trade_price = order.Price;

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
  name = translateName(name);

  return name;
}

function translateItems() {
  allItems = allItems.map((item) => {
    let name = item.name;
    if (item.translation) {
      name = item.translation;
    }
    name = translateName(name);

    if (name.includes(" Legs") || name.includes(" Wings")) {
      name = name + " (1 of 2)";
    }

    item.name = name;
    return item;
  });
}

function translateName(name) {
  if (allTranslations[name]) {
    return allTranslations[name];
  }

  return name;
}
