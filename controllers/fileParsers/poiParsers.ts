import { readJsonFile } from "../utils/read-json-file";
import * as utilityFunctions from "./utilityFunctions";

export const parsePoiData = (filePath: string) => {
	if (!filePath || typeof filePath !== "string") {
		return false;
	}

	const jsonData = readJsonFile(filePath);
	if (!jsonData || !Array.isArray(jsonData) || jsonData.length < 2) {
		return false;
	}

	const templateData = jsonData[1];
	if (!templateData?.Properties) return false;

	const { CachedActorLocationMap, MapPositionData } = templateData.Properties;

	if (!CachedActorLocationMap || !MapPositionData) return false;

	// Reverse MapPositionData: Map Location Key (e.g., "AC_WorkersGrave") -> Map Name (e.g. "EventMap_AncientCity_5H")
	const locationToMap = new Map<string, Set<string>>();
	for (const mapData of MapPositionData) {
		let mapName = mapData.Key;
		
		// Map explicitly defined maps to human-readable names
		if (mapName.includes("EventMap_AncientCity") || mapName.includes("AncientCity")) {
			mapName = "Ancient City";
		} else if (mapName.includes("EventMap_Cradle") || mapName.includes("Cradle")) {
			mapName = "Cradle";
		} else if (mapName.includes("EventMap_Canyon") || mapName.includes("Canyon")) {
			mapName = "Canyon";
		} else if (mapName.includes("EventMap_Volcanic") || mapName.includes("Volcanic")) {
			mapName = "Volcanic";
		} else if (mapName.includes("SleepingGiants") || mapName.includes("Sleeping Giants")) {
			mapName = "Sleeping Giants";
		} else if (mapName.includes("Kalin")) {
			mapName = "Kalin";
		}

		const spawnPositionsData = mapData.Value?.SpawnPositionsData;
		if (spawnPositionsData) {
			for (const spawnPos of spawnPositionsData) {
				const locKey = spawnPos.Key;
				if (!locationToMap.has(locKey)) locationToMap.set(locKey, new Set());
				locationToMap.get(locKey)?.add(mapName);
			}
		}
	}

	// Map Actor to Map Name using CachedActorLocationMap
	for (const actorMap of CachedActorLocationMap) {
		const classKey = actorMap.Key; // e.g. "BlueprintGeneratedClass'...AC_WorkersGrave_C'"
		const locKey = actorMap.Value; // e.g. "AC_WorkersGrave"

		// Extract the class name
		const match = classKey.match(/\.([^.']*)'$/);
		if (match && match[1]) {
			const actorClass = match[1]; // e.g. "AC_WorkersGrave_C"
			const maps = locationToMap.get(locKey);
			
			if (maps && maps.size > 0) {
				utilityFunctions.addPoiMapping(actorClass, Array.from(maps));
			}
		}
	}

	return true;
};
