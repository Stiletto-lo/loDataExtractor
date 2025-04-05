/**
 * Utility functions for file parsers
 *
 * This module provides utility functions for working with items, upgrades, creatures,
 * datatables, and blueprints in the data extraction process.
 */

const itemTemplate = require("../../templates/item");
const costTemplate = require("../../templates/cost");
const dataParser = require("../dataParsers");
const translator = require("../translator");

/**
 * DataStore - Encapsulates shared state to avoid global variables
 * and provides controlled access to data collections
 */
class DataStore {
	constructor() {
		this.items = [];
		this.upgradesData = [];
		this.creatures = [];
		this.datatables = [];
		this.blueprints = [];
	}

	// Item operations
	getAllItems() {
		return this.items;
	}

	setAllItems(items) {
		if (!Array.isArray(items)) {
			throw new TypeError("Items must be an array");
		}
		this.items = items;
	}

	/**
	 * Get an item by name
	 * @param {string} name - The name of the item to find
	 * @returns {Object|undefined} - The found item or undefined
	 * @throws {TypeError} - If name is not a string when provided
	 */
	getItem(name) {
		if (!name) {
			return undefined;
		}

		return this.items.find((item) => item.name === name || item?.translation === name);
	}

	/**
	 * Get an item by type
	 * @param {string} type - The type of the item to find
	 * @returns {Object|undefined} - The found item or undefined
	 * @throws {TypeError} - If type is not a string when provided
	 */
	getItemByType(type) {
		if (!type) {
			return undefined;
		}

		return this.items.find((item) => item.type === type);
	}

	/**
	 * Extract an item by type
	 * @param {string} type - The type of the item to extract
	 * @returns {Object} - A new item object with the type set
	 * @throws {TypeError} - If type is not a string when provided
	 */
	extractItemByType(type) {
		if (!type) {
			return { ...itemTemplate };
		}

		const item = this.getItemByType(type);
		if (item) {
			return { ...item };
		}

		const newItem = { ...itemTemplate };
		newItem.type = type;
		return newItem;
	}

	/**
	 * Get ingredients from an item
	 * @param {Object} data - The inputs object containing ingredient data
	 * @param {string} key - The key of the ingredient
	 * @returns {Object} - The ingredient object
	 * @throws {TypeError} - If inputs is not an object or key is not a string
	 */
	getIngredientsFromItem(data, key) {
		const ingredient = { ...costTemplate };
		ingredient.name = data[key]?.Key
			? dataParser.parseName(translator, data[key]?.Key)
			: dataParser.parseName(translator, Object.keys(data[key])[0]);
		ingredient.count = data[key]?.Key
			? data[key]?.Value
			: Object.values(data[key])[0];

		return ingredient;
	}

	// Upgrades operations
	getUpgradesData() {
		return this.upgradesData;
	}

	setUpgradesData(data) {
		if (!Array.isArray(data)) {
			throw new TypeError("Upgrades data must be an array");
		}
		this.upgradesData = data;
	}

	// Creatures operations
	getCreatures() {
		return this.creatures;
	}

	setCreatures(data) {
		if (!Array.isArray(data)) {
			throw new TypeError("Creatures data must be an array");
		}
		this.creatures = data;
	}

	// Datatables operations
	getAllDatatables() {
		return this.datatables;
	}

	setAllDatatables(data) {
		if (!Array.isArray(data)) {
			throw new TypeError("Datatables must be an array");
		}
		this.datatables = data;
	}

	// Blueprints operations
	getAllBlueprints() {
		return this.blueprints;
	}

	setAllBlueprints(data) {
		if (!Array.isArray(data)) {
			throw new TypeError("Blueprints must be an array");
		}
		this.blueprints = data;
	}
}

// Create and export a singleton instance
const dataStore = new DataStore();

module.exports = {
	// Item operations
	getItem: (name) => dataStore.getItem(name),
	getItemByType: (type) => dataStore.getItemByType(type),
	extractItemByType: (type) => dataStore.extractItemByType(type),
	getIngredientsFromItem: (inputs, key) =>
		dataStore.getIngredientsFromItem(inputs, key),

	// Collection getters
	getAllItems: () => dataStore.getAllItems(),
	getUpgradesData: () => dataStore.getUpgradesData(),
	getCreatures: () => dataStore.getCreatures(),
	getAllDatatables: () => dataStore.getAllDatatables(),
	getAllBlueprints: () => dataStore.getAllBlueprints(),

	// Collection setters
	setAllItems: (items) => dataStore.setAllItems(items),
	setUpgradesData: (data) => dataStore.setUpgradesData(data),
	setCreatures: (data) => dataStore.setCreatures(data),
	setAllDatatables: (data) => dataStore.setAllDatatables(data),
	setAllBlueprints: (data) => dataStore.setAllBlueprints(data),
};
