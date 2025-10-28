/**
 * Template for a DataTable that contains references to LootTables
 * This represents the structure of a DataTable with its properties and references to LootTables
 */

export type DataTable = {
	type?: string; // Type identifier to distinguish from LootTables
	name?: string; // Name of the data table
	objectName?: string; // Original object name reference
	objectPath?: string; // Path to the data table
	tables?: any[]; // Array of LootTable references with their properties
};
