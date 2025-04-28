/**
 * Utility functions for file parsers
 *
 * This module provides utility functions for working with items, tech, upgrades, creatures,
 * datatables, and blueprints in the data extraction process.
 */

const itemTemplate = require("../../templates/item");
const techTemplate = require("../../templates/tech");
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
		this.techData = [];
		this.upgradesData = [];
		this.creatures = [];
		this.lootTables = {};
		this.lootTemplates = [];
	}

	// Item operations
	getAllItems() {
		return this.items;
	}

	addItem(item) {
		if (!item) {
			throw new TypeError("Item must be defined");
		}

		const existingItem = this.items.find(
			(existingItem) => existingItem.type === item.type,
		);

		if (!existingItem) {
			this.items.push(item);
			return;
		}

		const newItem = { ...existingItem, ...item, };

		const existingItemIndex = this.items.indexOf(existingItem);
		if (existingItemIndex > -1) {
			this.items[existingItemIndex] = newItem;
		}
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

		return this.items.find(
			(item) => item.name === name || item?.translation === name,
		);
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

		return this.items.find(
			(item) =>
				item.type === type ||
				item.type === `${type}_C` ||
				`${item.type}_C` === type,
		);
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

	// Tech operations
	getTechData() {
		return this.techData;
	}

	addTechItem(item) {
		if (!item) {
			throw new TypeError("Item must be defined");
		}

		const existingItem = this.techData.find(
			(existingItem) => existingItem.type === item.type,
		);

		if (!existingItem) {
			this.techData.push(item);
			return;
		}

		const newItem = { ...existingItem, ...item, };

		const existingItemIndex = this.techData.indexOf(existingItem);
		if (existingItemIndex > -1) {
			this.techData[existingItemIndex] = newItem;
		}
	}

	// Loot tables operations
	getAllLootTables() {
		return this.lootTables;
	}

	setLootTables(lootTables) {
		if (typeof lootTables !== "object") {
			throw new TypeError("Loot tables must be an object");
		}
		this.lootTables = lootTables;
	}

	// Loot templates operations
	getAllLootTemplates() {
		return this.lootTemplates;
	}

	setLootTemplates(lootTemplates) {
		if (!Array.isArray(lootTemplates)) {
			throw new TypeError("Loot templates must be an array");
		}
		this.lootTemplates = lootTemplates;
	}

	setTechData(data) {
		if (!Array.isArray(data)) {
			throw new TypeError("Tech data must be an array");
		}
		this.techData = data;
	}

	/**
	 * Extract a tech entry by type
	 * @param {string} type - The type of the tech to extract
	 * @returns {Object} - A new tech object with the type set
	 */
	extractTechByType(type) {
		if (!type) {
			return { ...techTemplate };
		}

		const tech = this.techData.find(
			(tech) =>
				tech.type === type ||
				tech.type === `${type}_C` ||
				`${tech.type}_C` === type,
		);
		if (tech) {
			return { ...tech };
		}

		const newTech = { ...techTemplate };
		newTech.type = type;
		return newTech;
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

	// Blueprints operations removed as requested
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
	addItem: (item) => dataStore.addItem(item),

	// Tech operations
	getTechData: () => dataStore.getTechData(),
	setTechData: (data) => dataStore.setTechData(data),
	extractTechByType: (type) => dataStore.extractTechByType(type),
	addTechItem: (item) => dataStore.addTechItem(item),

	// Collection getters
	getAllItems: () => dataStore.getAllItems(),
	getUpgradesData: () => dataStore.getUpgradesData(),
	getCreatures: () => dataStore.getCreatures(),
	getAllLootTables: () => dataStore.getAllLootTables(),
	getAllLootTemplates: () => dataStore.getAllLootTemplates(),

	// Collection setters
	setAllItems: (items) => dataStore.setAllItems(items),
	setUpgradesData: (data) => dataStore.setUpgradesData(data),
	setCreatures: (data) => dataStore.setCreatures(data),
	setLootTables: (data) => dataStore.setLootTables(data),
	setLootTemplates: (data) => dataStore.setLootTemplates(data),
};
