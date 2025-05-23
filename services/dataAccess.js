

const fileParser = require("../controllers/fileParsers");

class DataAccess {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
  }

  getAllItems() {
    return fileParser.getAllItems();
  }

  getItemByName(name) {
    return fileParser.getItem(name);
  }

  getItemByType(type) {
    return fileParser.getItemByType(type);
  }

  getAllTechData() {
    return fileParser.getTechData();
  }

  getAllLootTables() {
    return fileParser.getAllLootTables();
  }

  getAllLootTemplates() {
    return fileParser.getAllLootTemplates();
  }

  getAllCreatures() {
    return fileParser.getCreatures();
  }

  getTranslator() {
    return fileParser.getTranslator();
  }

  getAllUpgradesData() {
    return fileParser.getUpgradesData();
  }
}

const dataAccess = new DataAccess();

module.exports = dataAccess;