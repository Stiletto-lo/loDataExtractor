require("dotenv").config();
const controller = {};
const aditionalTranslations = require("../translations/aditionalTranslations");
const lootSitesTranslations = require("../translations/lootSites");

let allTranslations = [];
let allDesriptions = [];
let translationsFromOtherLanguajes = [];
let descriptionsFromOtherLanguajes = [];
let translationsInUse = [];

const DEBUG = process.env.DEBUG === "true";

controller.translateLootSite = (name) => {
  if (name != null && lootSitesTranslations[name]) {
    return lootSitesTranslations[name].trim();
  }

  let anotherName = controller.searchName(name);
  if (anotherName != null) {
    return anotherName;
  }

  console.warn("No translation for: " + name);

  if (name.includes("Strongbox") || DEBUG) {
    return name.trim();
  }

  return "Unknown";
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
    controller.addTranslationInUuse(name, aditionalTranslations[name].trim());
    return aditionalTranslations[name].trim();
  }
  if (name != null && allTranslations[name]) {
    controller.addTranslationInUuse(name, allTranslations[name].trim());
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
    if (item.name) {
      controller.addTranslation(item.name, translateName);
    }
    name = translateName;
  }

  if (name) {
    if (
      (name.includes(" Legs") || name.includes(" Wings")) &&
      !name.includes("(1 of 2)") &&
      !name.includes("Schematic")
    ) {
      name = name + " (1 of 2)";
    }

    item.name = name.trim();
  }

  if (item.category) {
    let translateCategory = controller.searchName(item.category);
    if (translateCategory) {
      item.category = translateCategory.trim();
    }
  }

  if (item.learn) {
    let newItemLearn = [];
    item.learn.forEach((value) => {
      newItemLearn.push(controller.translateItemPart(value));
    });
    item.learn = newItemLearn;
  }

  return item;
};

controller.translateItemPart = (value) => {
  if (value) {
    let translateValue = controller.searchName(value);
    if (translateValue) {
      value = translateValue;
    }
    if (
      (value.includes(" Legs") || value.includes(" Wings")) &&
      !value.includes("(1 of 2)") &&
      !value.includes("Schematic")
    ) {
      value = value + " (1 of 2)";
    }

    value = value.trim();
  }

  return value;
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

controller.addTranslation = (key, translation, languaje = null) => {
  if (languaje == null) {
    if (key && translation && !allTranslations[key]) {
      allTranslations[key] = translation;
    }
  } else {
    if (translationsFromOtherLanguajes[languaje]) {
      let arrayL = translationsFromOtherLanguajes[languaje];
      arrayL[key] = translation;
      translationsFromOtherLanguajes[languaje] = arrayL;
    } else {
      let arrayL = [];
      arrayL[key] = translation;
      translationsFromOtherLanguajes[languaje] = arrayL;
    }
  }
};

controller.addDescription = (key, description, languaje = null) => {
  if (languaje == null) {
    allDesriptions[key] = description;
  } else {
    if (descriptionsFromOtherLanguajes[languaje]) {
      descriptionsFromOtherLanguajes[languaje][key] = description;
    } else {
      descriptionsFromOtherLanguajes[languaje] = [];
      descriptionsFromOtherLanguajes[languaje][key] = description;
    }
  }
};

controller.addTranslationInUuse = (key, translation) => {
  translationsInUse[key] = translation;
};

controller.getTranslateFiles = () => {
  for (const languaje in translationsFromOtherLanguajes) {
  }

  console.log(Object.keys(descriptionsFromOtherLanguajes).length);
};

module.exports = controller;
