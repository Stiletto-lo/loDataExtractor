/**
 * Template for a LootTemplate that contains simplified information
 * This represents the structure of a LootTemplate with only essential properties
 */

export type LootTemplate = {
	name?: string; // Name of the loot template (e.g., "EasyRupu_T3_C")
	type?: string; // Type of the loot template
	class?: string; // Class of the loot template
	super?: string; // Super class reference
	tables?: any[]; // Array of simplified loot tables with only essential information
};
