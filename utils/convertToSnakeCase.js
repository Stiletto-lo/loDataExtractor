/**
* Converts a string to snake_case for filenames
* @param {string} str - The string to convert
* @returns {string} - The snake_case string
*/
export function convertToSnakeCase(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, "") // Remove any non-alphanumeric characters except underscores
    .replace(/_+/g, "_"); // Replace multiple underscores with a single one
}