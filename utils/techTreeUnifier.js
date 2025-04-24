/**
 * Tech Tree Unifier
 *
 * Este script de utilidad analiza los datos de tecnología exportados para identificar y corregir
 * inconsistencias entre entradas del árbol tecnológico.
 *
 * Asegura que las entradas de tecnología sean únicas y tengan información consistente.
 */

const fs = require("node:fs");
const path = require("node:path");

/**
 * Unifica los datos del árbol tecnológico
 * @param {string} techFilePath - Ruta al archivo tech.json
 * @param {string} outputFilePath - Ruta para guardar el archivo tech.json actualizado
 */
function unifyTechTree(techFilePath, oldFilePath = null) {
  console.log("Cargando datos de tecnología desde:", techFilePath);

  let outputFilePath = oldFilePath;

  // Por defecto, sobrescribir el archivo de entrada si no se especifica un archivo de salida
  if (!outputFilePath) {
    outputFilePath = techFilePath;
  }

  try {
    // Cargar el archivo tech.json
    const techData = JSON.parse(fs.readFileSync(techFilePath, "utf8"));

    // Crear mapas para búsquedas más rápidas
    const techByName = new Map();
    const techByType = new Map();

    // Primera pasada: indexar tecnologías por nombre y tipo
    for (const tech of techData) {
      if (tech.name) {
        techByName.set(tech.name, tech);
      }
      if (tech.type) {
        techByType.set(tech.type, tech);
      }
    }

    // Segunda pasada: unificar tecnologías duplicadas
    let fixedCount = 0;
    const uniqueTechData = [];
    const processedNames = new Set();

    for (const tech of techData) {
      // Saltar si ya procesamos esta tecnología
      if (processedNames.has(tech.name)) {
        continue;
      }

      // Buscar tecnologías con el mismo nombre
      const duplicates = techData.filter(t => t.name === tech.name);
      if (duplicates.length > 1) {
        // Combinar información de todas las duplicadas
        const mergedTech = {};
        for (const dup of duplicates) {
          for (const [key, value] of Object.entries(dup)) {
            if (value !== undefined && value !== null) {
              // Si la propiedad es un array, combinar arrays
              if (Array.isArray(value) && Array.isArray(mergedTech[key])) {
                mergedTech[key] = [...new Set([...mergedTech[key], ...value])];
              } else {
                mergedTech[key] = value;
              }
            }
          }
        }
        uniqueTechData.push(mergedTech);
        fixedCount += duplicates.length - 1;
        console.log(`Unificadas ${duplicates.length} entradas para "${tech.name}"`);
      } else {
        // No hay duplicados, agregar directamente
        uniqueTechData.push(tech);
      }

      // Marcar como procesada
      processedNames.add(tech.name);
    }

    console.log(`Unificadas ${fixedCount} entradas de tecnología duplicadas`);

    // Escribir las tecnologías actualizadas al archivo
    fs.writeFileSync(outputFilePath, JSON.stringify(uniqueTechData, null, 2));
    console.log(`Tecnologías actualizadas guardadas en: ${outputFilePath}`);

    return { success: true, fixedCount };
  } catch (error) {
    console.error("Error al unificar el árbol tecnológico:", error);
    return { success: false, error: error.message };
  }
}

// Exportar la función para uso en otros scripts
module.exports = {
  unifyTechTree,
};

// Si este script se ejecuta directamente, procesar el archivo tech.json predeterminado
if (require.main === module) {
  const defaultTechPath = path.join(__dirname, "..", "exported", "tech.json");
  unifyTechTree(defaultTechPath);
}