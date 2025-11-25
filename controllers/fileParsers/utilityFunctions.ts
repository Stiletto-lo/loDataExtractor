/**
 * Utility functions for file parsers
 *
 * This module provides utility functions for working with items, tech, upgrades, creatures,
 * datatables, and blueprints in the data extraction process.
 */

import { itemTemplate } from "../../templates/item";
import type { Tech } from "../../templates/tech";
import { costTemplate } from "../../templates/cost";
import * as dataParser from "../dataParsers";
import * as translator from "../translator";

/**
 * DataStore - Encapsulates shared state to avoid global variables
 * and provides controlled access to data collections
 */
class DataStore {
	items: any[];
	techData: any[];
	upgradesData: any[];
	creatures: any[];
	lootTables: any;
	lootTemplates: any[];
	perks: any[];

	constructor() {
		this.items = [];
		this.techData = [];
		this.upgradesData = [];
		this.creatures = [];
		this.lootTables = {};
		this.lootTemplates = [];
		this.perks = [];
	}

	// Item operations
	getAllItems() {
		return this.items;
	}

	addItem(item: any) {
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

		let newItem = { ...existingItem, ...item };

		if (item.category?.includes("Structural")) {
			newItem = { ...item, ...existingItem };
		}

		const existingItemIndex = this.items.indexOf(existingItem);
		if (existingItemIndex > -1) {
			this.items[existingItemIndex] = newItem;
		}
	}

	setAllItems(items: any[]) {
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
	getItem(name: string) {
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
	getItemByType(type: string) {
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
	extractItemByType(type: string) {
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
	getIngredientsFromItem(data: any, key: string) {
		const ingredient = { ...costTemplate };
		ingredient.name = data[key]?.Key
			? dataParser.parseName(translator, data[key]?.Key)
			: dataParser.parseName(translator, Object.keys(data[key])?.[0] ?? "");
		ingredient.count = data[key]?.Key
			? data[key]?.Value
			: Object.values(data[key])[0];

		return ingredient;
	}

	// Tech operations
	getTechData() {
		return this.techData;
	}

	addTechItem(item: any) {
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

		const newItem = { ...existingItem, ...item };

		const existingItemIndex = this.techData.indexOf(existingItem);
		if (existingItemIndex > -1) {
			this.techData[existingItemIndex] = newItem;
		}
	}

	// Loot tables operations
	getAllLootTables() {
		return this.lootTables;
	}

	setLootTables(lootTables: any) {
		if (typeof lootTables !== "object") {
			throw new TypeError("Loot tables must be an object");
		}
		this.lootTables = lootTables;
	}

	addLootTable(lootTable: any) {
		if (!lootTable) {
			throw new TypeError("LootTable must be defined");
		}

		const existingItem = this.lootTables.find(
			(existingItem: any) => existingItem.name === lootTable.name,
		);

		if (!existingItem) {
			this.lootTables.push(lootTable);
			return;
		}

		const newItem = { ...existingItem, ...lootTable };

		const existingItemIndex = this.lootTables.indexOf(existingItem);
		if (existingItemIndex > -1) {
			this.lootTables[existingItemIndex] = newItem;
		}
	}

	// Loot templates operations
	getAllLootTemplates() {
		return this.lootTemplates;
	}

	setLootTemplates(lootTemplates: any[]) {
		if (!Array.isArray(lootTemplates)) {
			throw new TypeError("Loot templates must be an array");
		}
		this.lootTemplates = lootTemplates;
	}

	addLootTemplate(lootTemplate: any) {
		if (!lootTemplate) {
			throw new TypeError("LootTable must be defined");
		}

		const existingItem = this.lootTemplates.find(
			(existingItem) => existingItem.type === lootTemplate.type,
		);

		if (!existingItem) {
			this.lootTemplates.push(lootTemplate);
			return;
		}

		const newItem = { ...existingItem, ...lootTemplate };

		const existingItemIndex = this.lootTemplates.indexOf(existingItem);
		if (existingItemIndex > -1) {
			this.lootTemplates[existingItemIndex] = newItem;
		}
	}

	setTechData(data: any[]) {
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
	extractTechByType(type: string): Tech {
		if (!type) {
			return {} as Tech;
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

		const newTech = {};
		//@ts-expect-error fix later
		newTech.type = type;
		return newTech;
	}

	// Upgrades operations
	getUpgradesData() {
		return this.upgradesData;
	}

	setUpgradesData(data: any[]) {
		if (!Array.isArray(data)) {
			throw new TypeError("Upgrades data must be an array");
		}
		this.upgradesData = data;
	}

	// Creatures operations
	getCreatures() {
		return this.creatures;
	}

	setCreatures(data: any[]) {
		if (!Array.isArray(data)) {
			throw new TypeError("Creatures data must be an array");
		}
		this.creatures = data;
	}

	addCreature(creature: any) {
		if (!creature) {
			throw new TypeError("Creature must be defined");
		}

		const existingItem = this.creatures.find(
			(existingItem) => existingItem.type === creature.type,
		);

		if (!existingItem) {
			this.creatures.push(creature);
			return;
		}

		const newItem = { ...existingItem, ...creature };

		const existingItemIndex = this.creatures.indexOf(existingItem);
		if (existingItemIndex > -1) {
			this.creatures[existingItemIndex] = newItem;
		}
	}

	// Perk operations
	getAllPerks() {
		return this.perks;
	}

	setPerks(data: any[]) {
		if (!Array.isArray(data)) {
			throw new TypeError("Perks must be an array");
		}
		this.perks = data;
	}

	addPerk(perk: any) {
		if (!perk) {
			throw new TypeError("Perk must be defined");
		}

		const existingPerk = this.perks.find(
			(existingPerk) => existingPerk.name === perk.name,
		);

		if (!existingPerk) {
			this.perks.push(perk);
			return;
		}

		const newPerk = { ...existingPerk, ...perk };

		const existingPerkIndex = this.perks.indexOf(existingPerk);
		if (existingPerkIndex > -1) {
			this.perks[existingPerkIndex] = newPerk;
		}
	}

	getPerkByName(name: string) {
		if (!name) {
			return undefined;
		}

		return this.perks.find((perk) => perk.name === name);
	}
}

// Create and export a singleton instance
const dataStore = new DataStore();

export const getItem = (name: string) => dataStore.getItem(name);
export const getItemByType = (type: string) => dataStore.getItemByType(type);
export const extractItemByType = (type: string) =>
	dataStore.extractItemByType(type);
export const getIngredientsFromItem = (inputs: any, key: string) =>
	dataStore.getIngredientsFromItem(inputs, key);
export const addItem = (item: any) => dataStore.addItem(item);
export const getTechData = () => dataStore.getTechData();
export const setTechData = (data: any[]) => dataStore.setTechData(data);
export const extractTechByType = (type: string) =>
	dataStore.extractTechByType(type);
export const addTechItem = (item: any) => dataStore.addTechItem(item);
export const getAllItems = () => dataStore.getAllItems();
export const getUpgradesData = () => dataStore.getUpgradesData();
export const getCreatures = () => dataStore.getCreatures();
export const getAllPerks = () => dataStore.getAllPerks();
export const updateItem = (updatedItem: any) => {
	if (!updatedItem?.name) {
		return false;
	}

	const index = dataStore
		.getAllItems()
		.findIndex(
			(item) =>
				item.name === updatedItem.name ||
				(item.type && updatedItem.type && item.type === updatedItem.type),
		);

	if (index !== -1) {
		if (updatedItem.walkerInfo && dataStore.getAllItems()[index].walkerInfo) {
			updatedItem.walkerInfo = {
				...dataStore.getAllItems()[index].walkerInfo,
				...updatedItem.walkerInfo,
			};
		}

		// Merge the updated item with the existing one
		dataStore.getAllItems()[index] = {
			...dataStore.getAllItems()[index],
			...updatedItem,
		};
		return true;
	}

	return false;
};
export const addCreature = (creature: any) => dataStore.addCreature(creature);
export const getAllLootTables = () => dataStore.getAllLootTables();
export const addLootTable = (lootTable: any) =>
	dataStore.addLootTable(lootTable);
export const getAllLootTemplates = () => dataStore.getAllLootTemplates();
export const addLootTemplate = (lootTemplate: any) =>
	dataStore.addLootTemplate(lootTemplate);
export const setAllItems = (items: any[]) => dataStore.setAllItems(items);
export const setUpgradesData = (data: any[]) => dataStore.setUpgradesData(data);
export const setCreatures = (data: any[]) => dataStore.setCreatures(data);
export const setLootTables = (data: any) => dataStore.setLootTables(data);
export const setLootTemplates = (data: any[]) =>
	dataStore.setLootTemplates(data);
export const setPerks = (data: any[]) => dataStore.setPerks(data);
export const getPerkByName = (name: string) => dataStore.getPerkByName(name);
export const addPerk = (perk: any) => dataStore.addPerk(perk);
