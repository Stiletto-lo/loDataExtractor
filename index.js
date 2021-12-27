const fs = require("fs");
const path = require("path");

let allItems = [];

const itemTemplate = {
  category: undefined,
  cost: undefined,
  crafting: undefined,
  damage: undefined,
  name: undefined,
  parent: undefined,
  trade_price: undefined,
};
const craftingTemplate = [
  {
    ingredients: [{ count: undefined, name: undefined }],
    output: undefined,
    station: undefined,
  },
];

const costTemplate = {
  count: undefined,
  name: undefined,
};

loadDirData("./Data/TechTree", true);
loadDirData("./Data/Items", false);

allItems.forEach((item) => {
  Object.keys(item).forEach((key) => {
    if (item[key] === undefined) {
      delete item[key];
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

function loadDirData(techTreeDir, isTech = true) {
  let dir = path.join(__dirname, techTreeDir);
  let files = fs.readdirSync(dir);
  files.forEach((file) => {
    let fileData = fs.statSync(techTreeDir + "/" + file);
    if (fileData.isDirectory()) {
      loadDirData(techTreeDir + "/" + file, isTech);
    } else {
      if (isTech) {
        parseTechData(techTreeDir + "/" + file);
      } else {
        parseItemData(techTreeDir + "/" + file);
      }
    }
  });
}

function getItem(itemName) {
  let itemCopy = { ...itemTemplate };
  allItems.filter((item) => {
    if (item.name == itemName) {
      itemCopy = { ...item };
      return false;
    }
    return true;
  });
  itemCopy.name = itemName;

  return itemCopy;
}

function parseCategory(category) {
  category = category
    .replace("Mist/Content/Mist/Data/Items/Categories/", "")
    .trim();
  category = category.replace(".0", "").trim();
  return category;
}

function parseItemData(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  if (jsonData[1] && jsonData[1].Type) {
    let item = getItem(jsonData[1].Type);

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
        recipesData.forEach((recipe) => {});
      }
    }

    allItems.push(item);
  }
}

function parseTechData(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  let item = { ...itemTemplate };

  if (jsonData[1] && jsonData[1].Type) {
    item.name = jsonData[1].Type;
    if (
      jsonData[1].Properties &&
      jsonData[1].Properties.Requirements &&
      jsonData[1].Properties.Requirements[0] &&
      jsonData[1].Properties.Requirements[0].ObjectName
    ) {
      let parent = jsonData[1].Properties.Requirements[0].ObjectName;
      item.parent = parent.replace("BlueprintGeneratedClass", "").trim();
    }
    if (jsonData[1].Properties && jsonData[1].Properties.Cost) {
      let itemCost = { ...costTemplate };
      if (jsonData[1].Properties.Level && jsonData[1].Properties.Level > 30) {
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
