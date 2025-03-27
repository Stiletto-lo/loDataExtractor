/**
 * Translation parsers for handling translation-related data
 */

const fs = require('fs');
const dataParser = require('../dataParsers');
const translator = require('../translator');

/**
 * Parse translations data from a file
 * @param {string} filePath - The file path to parse
 */
const parseTranslations = (filePath) => {
  let rawdata = fs.readFileSync(filePath);
  let jsonData = JSON.parse(rawdata);
  if (jsonData[0]?.StringTable?.KeysToMetaData) {
    for (const key in jsonData[0].StringTable.KeysToMetaData) {
      if (key.includes(".Name")) {
        translator.addTranslation(
          key.replace(".Name", "").trim(),
          jsonData[0].StringTable.KeysToMetaData[key]
        );
      } else if (key.includes(".Description")) {
        translator.addDescription(
          key.replace(".Description", "").trim(),
          jsonData[0].StringTable.KeysToMetaData[key]
        );
      }
    }
  }
};

/**
 * Parse other translations data from a file
 * @param {string} filePath - The file path to parse
 */
const parseOtherTranslations = (filePath) => {
  if (/\/Game\/(.+)\/Game.json/.test(filePath)) {
    let match = filePath.match("/Game/(.+)/Game.json");
    if (match[1] != null) {
      let languaje = match[1];
      let rawdata = fs.readFileSync(filePath);
      let jsonData = JSON.parse(rawdata);

      for (const translationGroup in jsonData) {
        for (const key in jsonData[translationGroup]) {
          if (key.includes(".Description")) {
            translator.addDescription(
              key.replace(".Description", "").trim(),
              jsonData[translationGroup][key],
              languaje
            );
          } else {
            translator.addTranslation(
              key.replace(".Name", "").trim(),
              jsonData[translationGroup][key],
              languaje
            );
          }
        }
      }
    }
  }
};

module.exports = {
  parseTranslations,
  parseOtherTranslations
};