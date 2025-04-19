/**
 * Template for a DataTable that contains references to LootTables
 * This represents the structure of a DataTable with its properties and references to LootTables
 */

const datatable = {
	type: "DataTable", // Type identifier to distinguish from LootTables
	name: undefined, // Name of the data table
	objectName: undefined, // Original object name reference
	objectPath: undefined, // Path to the data table
	tables: [], // Array of LootTable references with their properties
};

Object.freeze(datatable);

module.exports = datatable;
