// Tipos básicos para el proyecto loDataExtractor

export interface BaseItem {
	name: string;
	displayName?: string;
	description?: string;
	icon?: string;
	category?: string;
	rarity?: string;
	stackSize?: number;
}

export interface Item extends BaseItem {
	type: string;
	weight?: number;
	durability?: number;
	value?: number;
	craftable?: boolean;
	recipe?: Recipe;
	modules?: ModuleInfo[];
	// Propiedades adicionales del template
	cost?: any;
	crafting?: any;
	parent?: string;
	trade_price?: number;
	translation?: string;
	projectileDamage?: any;
	experiencieReward?: number;
	weaponInfo?: any;
	toolInfo?: any;
	moduleInfo?: any;
	schematicName?: string;
	armorInfo?: any;
	movementSpeedReduction?: number;
	drops?: Drop[];
	structureInfo?: any;
	wikiVisibility?: boolean;
}

export interface Recipe {
	ingredients: Ingredient[];
	craftingTime?: number;
	craftingStation?: string;
	outputQuantity?: number;
}

export interface Ingredient {
	name: string;
	quantity: number;
}

export interface ModuleInfo {
	name: string;
	type: string;
	stats?: Record<string, number>;
}

export interface Creature {
	name: string;
	displayName?: string;
	tier?: string;
	health?: number;
	damage?: number;
	armor?: number;
	speed?: number;
	drops?: Drop[];
	habitat?: string[];
	// Propiedades adicionales del template
	type?: string;
	experience?: number;
	lootTemplate?: string;
	category?: string;
}

export interface Drop {
	item: string;
	quantity: number;
	chance: number;
}

export interface Tech {
	name: string;
	displayName?: string;
	description?: string;
	category?: string;
	cost?: Cost[];
	unlocks?: string[];
	prerequisites?: string[];
	// Propiedades adicionales del template
	parent?: string;
	type?: string;
	onlyDevs?: boolean;
	level?: number;
	pointsCost?: number;
}

export interface Cost {
	resource: string;
	amount: number;
}

export interface Perk {
	name: string;
	displayName?: string;
	description?: string;
	category?: string;
	maxLevel?: number;
	effects?: PerkEffect[];
}

export interface PerkEffect {
	type: string;
	value: number;
	level?: number;
}

export interface LootTable {
	name: string;
	entries: LootEntry[];
}

export interface LootEntry {
	item: string;
	weight: number;
	minQuantity?: number;
	maxQuantity?: number;
}

export interface LootTemplate {
	name: string;
	tables: string[];
	conditions?: Record<string, any>;
}

// Tipos para el sistema de traducción
export interface TranslationData {
	[key: string]: string | TranslationData;
}

export interface Translator {
	translate(key: string, locale?: string): string;
	getAvailableLocales(): string[];
}

// Tipos para configuración
export interface Config {
	CONTENT_FOLDER_PATH: string;
	EXPORT_FOLDER_PATH: string;
}

// Tipos para parsers
export interface ParsedData<T = any> {
	success: boolean;
	data?: T;
	error?: string;
}

export interface FileParserResult<T = any> {
	items?: T[];
	error?: string;
}