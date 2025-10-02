const fs = require("node:fs");

/**
 * Safely reads and parses a JSON file
 * @param {string} filePath - The file path to read
 * @returns {Object|null} - Parsed JSON data or null if error occurs
 */

const readJsonFile = (filePath, encoding = undefined) => {
  if (!filePath || typeof filePath !== "string") {
    console.error("Invalid file path provided to readJsonFile");
    return undefined;
  }


  try {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData.toString(encoding));
  } catch (error) {
    console.error(`Error reading or parsing file ${filePath}:`, error.message);
    return undefined;
  }

};

module.exports = {
  readJsonFile,
};
