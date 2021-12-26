const fs = require("fs");
const path = require("path");

let allItems = [];

const itemTemplate = {
  category: "",
  cost: {
    count: 0,
    name: "",
  },
  crafting: [{ ingredients: [{ count: 0, name: "" }], output: 0, station: "" }],
  damage: 0,
  name: "",
  parent: "",
  trade_price: 0,
};

loadTechTreeData("./Data/TechTree");

if (allItems.length > 0) {
  fs.writeFile("./items.json", JSON.stringify(allItems), function (err) {
    if (err) {
      console.error("Crap happens");
    }
  });
}

function loadTechTreeData(techTreeDir) {
  let dir = path.join(__dirname, techTreeDir);
  let files = fs.readdirSync(dir);
  files.forEach((file) => {
    let fileData = fs.statSync(techTreeDir + "/" + file);
    if (fileData.isDirectory()) {
      loadTechTreeData(techTreeDir + "/" + file);
    } else {
      parseTechData(techTreeDir + "/" + file);
    }
  });
}

function parseTechData(filePath) {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);

  let item = { ...itemTemplate };

  if (jsonData[1].Type != null) {
    item.name = jsonData[1].Type;
    if (
      jsonData[1].Properties != null &&
      jsonData[1].Properties.Requirements != null &&
      jsonData[1].Properties.Requirements[0] != null &&
      jsonData[1].Properties.Requirements[0].ObjectName != null
    ) {
      let parent = jsonData[1].Properties.Requirements[0].ObjectName;
      item.parent = parent.replace("BlueprintGeneratedClass", "").trim();
    }
    if (jsonData[1].Properties != null && jsonData[1].Properties.Cost != null) {
      let itemCost = { ...item.cost };
      itemCost.count = jsonData[1].Properties.Cost;

      item.cost = itemCost;
    }
  }
  allItems.push(item);
}
