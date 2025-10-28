import type { ProjectileDamage } from "../../../templates/projectileDamage";
import * as dataParser from "../../dataParsers";
import * as utilityFunctions from "../utilityFunctions";
import { readJsonFile } from "../../utils/read-json-file";

export const parseDamage = (filePath: string) => {
	const jsonData = readJsonFile(filePath);
	if (jsonData?.[1]?.Type) {
		const damageTypeClass = jsonData[1].Type;
		const allItemsWithThatDamage = utilityFunctions
			.getAllItems()
			.filter((item) => item.damageType === damageTypeClass);
		for (const itemSearch of allItemsWithThatDamage) {
			const item = utilityFunctions.getItem(itemSearch.name);
			if (item) {
				let proyectileDamage: ProjectileDamage = item.projectileDamage
					? item.projectileDamage
					: {};
				if (jsonData[1]?.Properties?.DamageAgainstSoft) {
					proyectileDamage.vsSoft = Number.parseInt(
						//@ts-expect-error fix later
						jsonData?.[1]?.Properties?.DamageAgainstSoft * 100,
						10,
					);
				}
				if (jsonData[1]?.Properties?.DamageAgainstMedium) {
					proyectileDamage.vsMedium = Number.parseInt(
						//@ts-expect-error fix later
						jsonData?.[1]?.Properties?.DamageAgainstMedium * 100,
						10,
					);
				}
				if (jsonData[1]?.Properties?.DamageAgainstHard) {
					proyectileDamage.vsHard = Number.parseInt(
						//@ts-expect-error fix later
						jsonData?.[1]?.Properties?.DamageAgainstHard * 100,
						10,
					);
				}
				if (jsonData[1]?.Properties?.DamageAgainstReinforced) {
					proyectileDamage.vsReinforced = Number.parseInt(
						//@ts-expect-error fix later
						jsonData?.[1]?.Properties?.DamageAgainstReinforced * 100,
						10,
					);
				}
				if (jsonData[1]?.Properties?.DamageAgainstSolid) {
					proyectileDamage.vsSolid = Number.parseInt(
						//@ts-expect-error fix later
						jsonData?.[1]?.Properties?.DamageAgainstSolid * 100,
						10,
					);
				}

				proyectileDamage = dataParser.cleanEmptyObject(proyectileDamage);
				if (proyectileDamage) {
					item.projectileDamage = proyectileDamage;
				}

				utilityFunctions.addItem(item);
			}
		}
	}
};
