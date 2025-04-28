const fs = require("node:fs");

const projectileDamageTemplate = require("../../../templates/projectileDamage");
const dataParser = require("../../dataParsers");
const utilityFunctions = require("../utilityFunctions");

const parseDamage = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (jsonData[1]?.Type) {
		const damageTypeClass = jsonData[1].Type;
		const allItemsWithThatDamage = utilityFunctions
			.getAllItems()
			.filter((item) => item.damageType === damageTypeClass);
		for (const itemSearch of allItemsWithThatDamage) {
			const item = utilityFunctions.getItem(itemSearch.name);
			if (item) {
				let proyectileDamage = item.projectileDamage
					? item.projectileDamage
					: { ...projectileDamageTemplate };
				proyectileDamage.vsSoft = jsonData[1]?.Properties?.DamageAgainstSoft
					? Number.parseInt(jsonData[1].Properties.DamageAgainstSoft * 100, 10)
					: undefined;
				proyectileDamage.vsMedium = jsonData[1]?.Properties?.DamageAgainstMedium
					? Number.parseInt(
						jsonData[1].Properties.DamageAgainstMedium * 100,
						10,
					)
					: undefined;
				proyectileDamage.vsHard = jsonData[1]?.Properties?.DamageAgainstHard
					? Number.parseInt(jsonData[1].Properties.DamageAgainstHard * 100, 10)
					: undefined;
				proyectileDamage.vsReinforced = jsonData[1]?.Properties
					?.DamageAgainstReinforced
					? Number.parseInt(
						jsonData[1].Properties.DamageAgainstReinforced * 100,
						10,
					)
					: undefined;
				proyectileDamage.vsSolid = jsonData[1]?.Properties?.DamageAgainstSolid
					? Number.parseInt(jsonData[1].Properties.DamageAgainstSolid * 100, 10)
					: undefined;

				proyectileDamage = dataParser.cleanEmptyObject(proyectileDamage);
				if (proyectileDamage != null) {
					item.projectileDamage = proyectileDamage;
				}

				utilityFunctions.addItem(item);
			}
		}
	}
};

module.exports = {
	parseDamage,
};
