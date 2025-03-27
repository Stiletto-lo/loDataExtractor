/**
 * Utility functions for file parsers
 */

const itemTemplate = require('../../templates/item');
const ingredienTemplate = require('../../templates/cost');

// Shared state variables
let allItems = [];
let upgradesData = [];
let creatures = [];
let allDatatables = [];
let allBlueprints = [];

/**
 * Get an item by name
 * @param {string} name - The name of the item to find
 * @returns {Object|undefined} - The found item or undefined
 */
const getItem = (name) => {
  if (!name) return undefined;

  return allItems.find((item) => item.name === name);
};

/**
 * Get an item by type
 * @param {string} type - The type of the item to find
 * @returns {Object|undefined} - The found item or undefined
 */
const getItemByType = (type) => {
  if (!type) return undefined;

  return allItems.find((item) => item.type === type);
};

/**
 * Extract an item by type
 * @param {string} type - The type of the item to extract
 * @returns {Object} - A new item object with the type set
 */
const extractItemByType = (type) => {
  if (!type) return { ...itemTemplate };

  let item = getItemByType(type);
  if (item) {
    return { ...item };
  }

  let newItem = { ...itemTemplate };
  newItem.type = type;
  return newItem;
};

/**
 * Get ingredients from an item
 * @param {Object} inputs - The inputs object
 * @param {string} key - The key of the ingredient
 * @returns {Object} - The ingredient object
 */
const getIngredientsFromItem = (inputs, key) => {
  let ingredient = { ...ingredienTemplate };
  ingredient.name = key;
  ingredient.count = inputs[key];
  return ingredient;
};

// Getter functions for shared state
const getAllItems = () => allItems;
const getUpgradesData = () => upgradesData;
const getCreatures = () => creatures;
const getAllDatatables = () => allDatatables;
const getAllBlueprints = () => allBlueprints;

// Setter functions for shared state
const setAllItems = (items) => {
  allItems = items;
};

const setUpgradesData = (data) => {
  upgradesData = data;
};

const setCreatures = (data) => {
  creatures = data;
};

const setAllDatatables = (data) => {
  allDatatables = data;
};

const setAllBlueprints = (data) => {
  allBlueprints = data;
};

module.exports = {
  getItem,
  getItemByType,
  extractItemByType,
  getIngredientsFromItem,
  getAllItems,
  getUpgradesData,
  getCreatures,
  getAllDatatables,
  getAllBlueprints,
  setAllItems,
  setUpgradesData,
  setCreatures,
  setAllDatatables,
  setAllBlueprints
};