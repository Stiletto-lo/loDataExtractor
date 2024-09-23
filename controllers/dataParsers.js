const controller = {};

controller.parseName = (translator, name) => {
  if (name == null) {
    return;
  }

  name = String(name);
  name = name.replaceAll("'", "").trim();
  name = name.replaceAll(".Name", "").trim();
  name = controller.parseType(name);
  name = name.replaceAll("_C", "").trim();
  name = name.replaceAll("DataTable", "").trim();
  let translateName = translator.translateName(name);
  if (translateName != null) {
    name = translateName;
  }

  if (!name.includes("Schematic")) {
    if (/(.+)Legs/.test(name)) {
      let match = name.match(/(.+)Legs/);
      if (match[1] != null) {
        let walkerName = translator.translateName(match[1].trim() + " Walker");
        let legType = "";
        if (name.includes("_T2")) {
          legType = "Armored";
        } else if (name.includes("_T3")) {
          legType = "Heavy";
        }
        name = (walkerName.trim() + " Legs " + legType).trim() + " (1 of 2)";
      }
    } else if (/(.+)Wings/.test(name)) {
      let match = name.match(/(.+)Wings/);
      if (match[1] != null) {
        let walkerName = translator.translateName(match[1].trim() + " Walker");
        let wingsType = "Wings";
        if (name.includes("_T2_Small")) {
          wingsType = "Wings Small";
        } else if (name.includes("_T3_Medium")) {
          wingsType = "Wings Medium";
        } else if (name.includes("_T4")) {
          wingsType = "Wings Large";
        } else if (name.includes("_T2_Heavy")) {
          wingsType = "Wings Heavy";
        } else if (name.includes("_T3_Rugged")) {
          wingsType = "Wings Rugged";
        } else if (name.includes("_T2_Skirmish")) {
          wingsType = "Wings Skirmish";
        } else if (name.includes("_T3_Raider")) {
          wingsType = "Wings Raider";
        }

        name = (walkerName.trim() + " " + wingsType).trim() + " (1 of 2)";
      }
    } else if (name.includes("Upgrades")) {
      if (/(.+)BoneUpgrades/.test(name)) {
        let match = name.match(/(.+)BoneUpgrades/);
        if (match[1] != null) {
          let walkerName = translator.translateName(
            match[1].trim() + " Walker"
          );
          name = walkerName + " Upgrades - Tier 2";
        }
      } else if (/(.+)CeramicUpgrades/.test(name)) {
        let match = name.match(/(.+)CeramicUpgrades/);
        if (match[1] != null) {
          let walkerName = translator.translateName(
            match[1].trim() + " Walker"
          );
          name = walkerName + " Upgrades - Tier 3";
        }
      } else if (/(.+)IronUpgrades/.test(name)) {
        let match = name.match(/(.+)IronUpgrades/);
        if (match[1] != null) {
          let walkerName = translator.translateName(
            match[1].trim() + " Walker"
          );
          name = walkerName + " Upgrades - Tier 4";
        }
      } else if (/(.+)WoodUpgrades/.test(name)) {
        let match = name.match(/(.+)WoodUpgrades/);
        if (match[1] != null) {
          let walkerName = translator.translateName(
            match[1].trim() + " Walker"
          );
          name = walkerName;
        }
      }
    }
  }

  name = controller.parseRigName(translator, name);

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
  if (category) {
    category = category
      .replace("Mist/Content/Mist/Data/Items/Categories/", "")
      .trim();
    category = category.replace("EMistWalkerCategory::", "").trim();
    category = category.replace(".0", "").trim();
  }
  return category;
};

controller.parseObjectPath = (objectName) => {
  if (objectName) {
    const objectNameArray = objectName.split("/");
    const last = objectNameArray[objectNameArray.length - 1];
    objectName = last.replace(".0", "").trim();
  }
  return objectName;
};


controller.parseRigName = (translator, name) => {
  if (name.includes("Rig") && /(.+)Rig_/.test(name)) {
    let rig = "";
    if (name.includes("2")) {
      rig = "T2";
    } else if (name.includes("T1")) {
      rig = "T1";
    } else if (name.includes("T3")) {
      rig = "T3";
    }
    if (name.includes("Default")) {
      name = name.replaceAll("Default", "").trim();
    }
    let match = name.match(/(.+)Rig_/);
    if (match[1] != null) {
      let walkerName = translator.translateName(match[1] + " Walker");
      name = walkerName + " Rig " + rig;
    }
  }

  return name;
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
  if (profile == null) {
    return "";
  }

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

  if (name != null) {
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

controller.cleanEmptyObject = (obj) => {
  if (obj) {
    Object.keys(obj).forEach((key) => {
      if (obj[key] === undefined || obj[key] === null) {
        delete obj[key];
      }
    });
    if (Object.keys(obj).length > 0) {
      return obj;
    }
  }

  return null;
};

module.exports = controller;
