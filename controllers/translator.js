const controller = {};
const aditionalTranslations = require("../translations/aditionalTranslations");
const lootSitesTranslations = require("../translations/lootSites");
let allTranslations = [];
let allDesriptions = [];

controller.translateLootSite = (name) => {
  if (name != null && lootSitesTranslations[name]) {
    return lootSitesTranslations[name].trim();
  }

  let anotherName = controller.searchName(name);
  if (anotherName != null) {
    return anotherName;
  }
  return "Loot";
  //return name.trim();
};

controller.translateName = (name) => {
  let anotherName = controller.searchName(name);
  if (anotherName != null) {
    return anotherName;
  }
  return name.trim();
};

controller.searchName = (name) => {
  if (name != null && aditionalTranslations[name]) {
    return aditionalTranslations[name].trim();
  }
  if (name != null && allTranslations[name]) {
    return allTranslations[name].trim();
  }
  return null;
};

controller.translateItems = (allItems) => {
  return (allItems = allItems.map((item) => {
    return controller.translateItem(item);
  }));
};

controller.translateItem = (item) => {
  let name = item.name;

  if (item.translation) {
    name = item.translation;
  }

  let translateName = controller.searchName(item.translation);
  if (translateName) {
    name = translateName;
  }

  if (
    (name.includes(" Legs") || name.includes(" Wings")) &&
    !name.includes("(1 of 2)")
  ) {
    name = name + " (1 of 2)";
  }

  item.name = name.trim();

  if (item.category) {
    let translateCategory = controller.searchName(item.category);
    if (translateCategory) {
      item.category = translateCategory.trim();
    }
  }

  return item;
};

controller.addDescriptions = (allItems) => {
  return (allItems = allItems.map((item) => {
    let name = item.name;
    if (item.translation) {
      name = item.translation;
    }

    if (allDesriptions[name]) {
      item.description = allDesriptions[name].trim();
    }

    return item;
  }));
};

controller.addTranslation = (key, translation) => {
  allTranslations[key] = translation;
};

controller.addDescription = (key, description) => {
  allDesriptions[key] = description;
};

module.exports = controller;
