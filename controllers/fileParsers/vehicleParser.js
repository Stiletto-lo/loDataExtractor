/**
 * Vehicle parser for handling walker-related data
 * 
 * This module provides functions for parsing and extracting vehicle information
 * from game data files, specifically focusing on walker capacity data.
 */

const fs = require("node:fs");
const path = require("node:path");
const utilityFunctions = require("./utilityFunctions");
const { readJsonFile } = require("../utils/read-json-file");

/**
 * Parse vehicle data from a file to extract capacity information
 * @param {string} filePath - The file path to parse
 */
const parseVehicleData = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Vehicle file does not exist: ${filePath}`);
      return;
    }

    const jsonData = readJsonFile(filePath, "utf8");

    // Extract the vehicle name from the file path
    const fileName = path.basename(filePath, ".json");

    // Find the vehicle item by matching the name in the path
    const vehicleItems = utilityFunctions.getAllItems().filter(item => {
      // Check if this is a walker by category or if the name matches
      return (item.category === "Walkers" ||
        (item.name?.toLowerCase().includes(fileName.toLowerCase())));
    });

    if (vehicleItems.length === 0) {
      return;
    }

    // Look for AttachedWeightMinPenalty in the JSON data
    let carryCapacity = null;

    const findCarryCapacity = (obj) => {
      if (!obj || typeof obj !== 'object') return null;

      if (obj.Properties && obj.Properties.AttachedWeightMinPenalty !== undefined) {
        return obj.Properties.AttachedWeightMinPenalty;
      }

      if (obj.ChildProperties && Array.isArray(obj.ChildProperties)) {
        for (const prop of obj.ChildProperties) {
          if (prop.Name === "AttachedWeightMinPenalty" &&
            (prop.Type === "FloatProperty" || prop.Type === "IntProperty")) {
            return prop.Value !== undefined ? prop.Value : prop.ElementSize;
          }
        }
      }

      for (const key in obj) {
        if (key === "AttachedWeightMinPenalty") {
          return obj[key];
        }

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key])) {
            for (const item of obj[key]) {
              const result = findCarryCapacity(item);
              if (result !== null) return result;
            }
          } else {
            const result = findCarryCapacity(obj[key]);
            if (result !== null) return result;
          }
        }
      }

      return null;
    };

    for (const entry of jsonData) {
      const result = findCarryCapacity(entry);
      if (result !== null) {
        carryCapacity = result;
        break;
      }
    }

    if (carryCapacity !== null) {
      // Update all matching vehicle items with the capacity information
      for (const vehicleItem of vehicleItems) {
        if (!vehicleItem.walkerInfo) {
          vehicleItem.walkerInfo = {};
        }
        vehicleItem.walkerInfo.carryCapacity = carryCapacity;

        // Update the item in the global items collection
        utilityFunctions.updateItem(vehicleItem);
      }
    }
  } catch (error) {
    console.error(`Error parsing vehicle data from ${filePath}:`, error);
  }
};

/**
 * Process all vehicle files in a directory to extract capacity information
 * @param {string} vehiclesDir - Directory containing vehicle JSON files
 */
const processVehicleFiles = (vehiclesDir) => {
  if (!fs.existsSync(vehiclesDir)) {
    console.error(`Vehicles directory does not exist: ${vehiclesDir}`);
    return;
  }

  console.log(`Processing vehicle files in ${vehiclesDir}...`);

  // Get all subdirectories (each vehicle type has its own folder)
  const vehicleFolders = fs.readdirSync(vehiclesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  let processedCount = 0;

  // Process each vehicle folder
  for (const folder of vehicleFolders) {
    const vehicleFolderPath = path.join(vehiclesDir, folder);

    // Look for the main JSON file with the same name as the folder
    const mainJsonFile = path.join(vehicleFolderPath, `${folder}.json`);

    if (fs.existsSync(mainJsonFile)) {
      parseVehicleData(mainJsonFile);
      processedCount++;
    } else {
      // If no main file, try to find any JSON file in the folder
      const files = fs.readdirSync(vehicleFolderPath)
        .filter(file => file.endsWith(".json"));

      if (files.length > 0) {
        parseVehicleData(path.join(vehicleFolderPath, files[0]));
        processedCount++;
      }
    }
  }

  console.log(`Processed ${processedCount} vehicle files`);
};

module.exports = {
  parseVehicleData,
  processVehicleFiles
};