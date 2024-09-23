require("dotenv").config();
const controller = {};
const aditionalTranslations = require("../translations/aditionalTranslations");
const lootSitesTranslations = require("../translations/lootSites");

let allTranslations = [];
let allDesriptions = [];
let translationsFromOtherLanguajes = [];
let descriptionsFromOtherLanguajes = [];
let translationsInUse = [];

controller.translateLootSite = (name) => {
  if (name != null && lootSitesTranslations[name]) {
    return lootSitesTranslations[name].trim();
  }

  let anotherName = controller.searchName(name);
  if (anotherName != null) {
    return anotherName;
  }

  name = controller.translateEachPart(name);

  console.warn("No translation for: " + name);

  return name.trim();
};

controller.translateEachPart = (name) => {
  const words = name.split('_');


  return words.reduce((accumulator, word) => {
    let anotherName = controller.searchName(word);
    if (anotherName != null) {
      return `${accumulator} ${anotherName}`;
    } else {
      return `${accumulator} ${word}`;
    }
  }, "");
}

controller.translateName = (name) => {
  let anotherName = controller.searchName(name);
  if (anotherName != null) {
    return anotherName;
  }
  return name.trim();
};

controller.searchName = (name) => {
  if (name == null || !name) {
    return null;
  }

  if (aditionalTranslations[name]) {
    controller.addTranslationInUuse(name, aditionalTranslations[name].trim());
    return aditionalTranslations[name].trim();
  }

  if (allTranslations[name]) {
    controller.addTranslationInUuse(name, allTranslations[name].trim());
    return allTranslations[name].trim();
  }

  if (lootSitesTranslations[name]) {
    controller.addTranslationInUuse(name, lootSitesTranslations[name].trim());
    return lootSitesTranslations[name].trim();
  }

  return null;
};

controller.translateItems = (allItems) => allItems.map((item) => controller.translateItem(item));

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

controller.addDescriptions = (allItems) => allItems.map((item) => {
  let name = item.name;
  if (item.translation) {
    name = item.translation;
  }

  if (allDesriptions[name]) {
    item.description = allDesriptions[name].trim();
  }

  return item;
});

controller.addLootSiteTranslation = (key, translation) => {
  if (!key || !translation) {
    return;
  }

  const keyCleaned = key.replaceAll("_C", "").trim();

  if (!lootSitesTranslations[keyCleaned]) {
    lootSitesTranslations[keyCleaned] = translation.trim();
  }
};

controller.addTranslation = (key, translation, languaje = null) => {
  if (languaje == null) {
    if (key && translation && !allTranslations[key]) {
      allTranslations[key] = translation;
    }
  } else if (translationsFromOtherLanguajes[languaje]) {
    translationsFromOtherLanguajes[languaje][key] = translation;
  } else {
    let arrayL = [];
    arrayL[key] = translation;
    translationsFromOtherLanguajes[languaje] = arrayL;
  }
};

controller.addDescription = (key, description, languaje = null) => {
  if (languaje == null) {
    allDesriptions[key] = description;
  } else if (descriptionsFromOtherLanguajes[languaje]) {
    descriptionsFromOtherLanguajes[languaje][key] = description;
  } else {
    descriptionsFromOtherLanguajes[languaje] = [];
    descriptionsFromOtherLanguajes[languaje][key] = description;
  }
};

controller.addTranslationInUuse = (key, translation) => {
  translationsInUse[key] = translation;
};

controller.isKeyTranslationInUse = (key) => {
  return translationsInUse[key] != null && translationsInUse[key] != undefined;
};

controller.getTranslateFiles = () => {
  let translationsFiltered = {};

  for (const languaje in translationsFromOtherLanguajes) {
    for (const key in translationsFromOtherLanguajes[languaje]) {
      if (!translationsFiltered[languaje]) {
        translationsFiltered[languaje] = {};
      }
      if (
        translationsFromOtherLanguajes[languaje][key] &&
        controller.isKeyTranslationInUse(key)
      ) {
        let translation = translationsInUse[key];

        translationsFiltered[languaje][translation] =
          translationsFromOtherLanguajes[languaje][key];
      }
    }
  }
  return translationsFiltered;
};

module.exports = controller;
