const { category } = require("../templates/item");

const controller = {};

controller.parseName = (translator, name) => {
  name = controller.parseType(name);
  name = name.replace("_C", "").trim();
  name = name.replace("DataTable", "").trim();
  let translateName = translator.translateName(name);
  if (translateName != null) {
    name = translateName;
  }

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
    if (/(.+)BoneUpgrades/.test(name)) {
      let match = name.match(/(.+)BoneUpgrades/);
      if (match[1] != null) {
        let walkerName = translator.translateName(match[1] + " Walker");
        name = walkerName + " Upgrades - Tier 2";
      }
    } else if (/(.+)CeramicUpgrades/.test(name)) {
      let match = name.match(/(.+)CeramicUpgrades/);
      if (match[1] != null) {
        let walkerName = translator.translateName(match[1] + " Walker");
        name = walkerName + " Upgrades - Tier 3";
      }
    } else if (/(.+)IronUpgrades/.test(name)) {
      let match = name.match(/(.+)IronUpgrades/);
      if (match[1] != null) {
        let walkerName = translator.translateName(match[1] + " Walker");
        name = walkerName + " Upgrades - Tier 4";
      }
    } else if (/(.+)WoodUpgrades/.test(name)) {
      let match = name.match(/(.+)WoodUpgrades/);
      if (match[1] != null) {
        let walkerName = translator.translateName(match[1] + " Walker");
        name = walkerName;
      }
    }
  }

  if (name == "Nomad Walker") {
    name = "Nomad Spider Walker";
  }

  return name.trim();
};

controller.parseType = (name) => {
  name = name.replace("BlueprintGeneratedClass", "").trim();
  name = name.replace(".0", "").trim();
  let dot = name.indexOf(".");
  if (dot > 0) {
    name = name.slice(dot + 1);
  }
  return name;
};

controller.parseCategory = (category) => {
  category = category
    .replace("Mist/Content/Mist/Data/Items/Categories/", "")
    .trim();
  category = category.replace("EMistWalkerCategory::", "").trim();
  category = category.replace(".0", "").trim();
  return category;
};

controller.parseStructureName = (category, name) => {
  let type = "";
  if (category.includes("Concrete")) {
    type = "Cement";
  } else if (category.includes("WoodLight")) {
    type = "Light Wood";
  } else if (category.includes("Ceramic") || category.includes("Clay")) {
    type = "Clay";
  } else if (category.includes("StoneNew")) {
    type = "Stone";
  } else if (category.includes("WoodHeavy")) {
    type = "Heavy Wood";
  } else if (category.includes("WoodMedium")) {
    type = "Medium Wood";
  }

  return `${type} ${name}`.trim();
};

controller.parseUpgradeName = (name, profile) => {
  if (
    profile.includes("BaseSparePartsProfile") ||
    profile.includes("MediumSparePartsProfile") ||
    profile.includes("LargeSparePartsProfile") ||
    profile.includes("SmallSparePartsProfile")
  ) {
    return profile;
  }

  let walkerName = profile.replaceAll("SparePartsProfile", "").trim();
  let tier = 1;
  let type = "Water";

  if (name.includes("Wood")) {
    tier = 1;
  } else if (name.includes("Bone")) {
    tier = 2;
  } else if (name.includes("Ceramic")) {
    tier = 3;
  } else if (name.includes("Iron")) {
    tier = 4;
  }

  if (name.includes("Cargo")) {
    type = "Cargo";
  } else if (name.includes("Hatch")) {
    type = "Gear";
  } else if (name.includes("Water")) {
    type = "Water";
  } else if (name.includes("Torque")) {
    type = "Torque";
  } else if (name.includes("Gears")) {
    type = "Mobility";
  } else if (name.includes("Armor")) {
    type = "Durability";
  } else if (name.includes("Packing")) {
    type = "Packing";
  }

  return `${walkerName} Walker Upgrade - ${type} - Tier ${tier}`;
};

controller.itemMerger = (allItems = [], mainItemName, otherItemName) => {
  let mainItem = allItems.find(
    (item) => item.name && item.name == mainItemName
  );
  let otherItem = allItems.find(
    (item) => item.name && item.name == otherItemName
  );

  let allItemsFiltered = allItems.filter(
    (item) =>
      item.name && item.name != otherItemName && item.name != mainItemName
  );

  if (mainItem && otherItem) {
    let newItem = { ...mainItem };

    for (const key in otherItem) {
      if (otherItem[key] && !mainItem[key]) {
        newItem[key] = otherItem[key];
      }
    }

    allItemsFiltered.push(newItem);
  } else if (mainItem) {
    allItemsFiltered.push(mainItem);
  } else if (otherItem) {
    allItemsFiltered.push(otherItem);
  }
  return allItemsFiltered;
};

module.exports = controller;
